import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { 
  uploadToOSS, 
  uploadMultipleToOSS, 
  generatePresignedUrl, 
  validateFileType, 
  validateFileSize,
  deleteFromOSS 
} from './utils/ossConfig.js';
import { requestLogMiddleware, errorLogMiddleware, createLogger } from './utils/logMiddleware.js';
import { createChatRouter } from './routes/chatRouter.js';
import { createKnowledgeBaseRouter } from './routes/knowledgeBaseRouter.js';
import { createPromptRouter } from './routes/promptRouter.js';

// ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Client } = pg;
const app = express();
const PORT = process.env.PORT || 3006;

// 中间件
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// 配置multer用于文件上传（使用内存存储）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
    files: 10 // 最多10个文件
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 [Multer] 文件过滤器检查:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    if (validateFileType(file)) {
      console.log('✅ [Multer] 文件类型验证通过');
      cb(null, true);
    } else {
      console.log('❌ [Multer] 文件类型验证失败');
      cb(new Error('不支持的文件类型，仅支持 JPEG、PNG、GIF、WebP 格式'), false);
    }
  }
});

// 添加multer错误处理中间件
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error('❌ [Multer] 文件上传错误:', error.message);
    return res.status(400).json({
      success: false,
      message: `文件上传错误: ${error.message}`
    });
  } else if (error) {
    console.error('❌ [Server] 服务器错误:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
  next();
});

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'hjxlog',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
};

// 创建数据库连接池
let dbClient = null;
let logger = null;

// 连接数据库
async function connectDatabase() {
  try {
    dbClient = new Client(dbConfig);
    await dbClient.connect();
    console.log('✅ [数据库] PostgreSQL连接成功');
    
    // 初始化日志记录器
    logger = createLogger(dbClient);
    
    // 记录系统启动日志
    await logger.system('server', 'startup', '服务器启动，数据库连接成功');
    
    return true;
  } catch (error) {
    console.error('❌ [数据库] PostgreSQL连接失败:', error.message);
    dbClient = null;
    return false;
  }
}

// 启动时连接数据库
connectDatabase();

// 添加日志中间件（需要在路由定义之前）
app.use((req, res, next) => {
  if (dbClient) {
    requestLogMiddleware(dbClient)(req, res, next);
  } else {
    next();
  }
});

// 添加错误日志中间件
app.use((error, req, res, next) => {
  if (dbClient) {
    errorLogMiddleware(dbClient)(error, req, res, next);
  } else {
    next(error);
  }
});

// API路由

// ==================== AI 聊天相关API ====================
// 使用路由函数获取 dbClient，确保在数据库连接后可用
app.use('/api/chat', (req, res, next) => {
  if (!dbClient) {
    return res.status(503).json({
      success: false,
      message: 'Database not connected'
    });
  }
  createChatRouter(() => dbClient)(req, res, next);
});

// ==================== 知识库管理相关API ====================
app.use('/api/knowledge-base', (req, res, next) => {
  if (!dbClient) {
    return res.status(503).json({
      success: false,
      message: 'Database not connected'
    });
  }
  createKnowledgeBaseRouter(() => dbClient)(req, res, next);
});

// ==================== 提示词配置相关API ====================
app.use('/api/prompts', (req, res, next) => {
  if (!dbClient) {
    return res.status(503).json({
      success: false,
      message: 'Database not connected'
    });
  }
  createPromptRouter(() => dbClient)(req, res, next);
});

// ==================== 图片上传相关API ====================

// 单个图片上传到OSS
app.post('/api/upload/image', (req, res, next) => {
  console.log('🔍 [API] 收到图片上传请求:', {
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    hasFile: !!req.file,
    body: Object.keys(req.body),
    files: req.files ? req.files.length : 0
  });
  next();
}, upload.single('image'), async (req, res) => {
  try {
    console.log('🔍 [API] Multer处理后:', {
      hasFile: !!req.file,
      fileInfo: req.file ? {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null
    });
    
    if (!req.file) {
      console.log('❌ [API] 没有接收到文件');
      return res.status(400).json({
        success: false,
        message: '请选择要上传的图片文件'
      });
    }

    console.log('📸 [API] 单个图片上传请求:', req.file.originalname);

    const result = await uploadToOSS(req.file);

    console.log('✅ [API] 图片上传成功:', result.url);
    res.json({
      success: true,
      data: result,
      message: '图片上传成功'
    });

  } catch (error) {
    console.error('❌ [API] 图片上传失败:', error.message);
    
    // 记录OSS上传错误日志
    if (logger) {
      await logger.error('upload', 'oss_upload_single', error, {
        user_id: req.user?.id || null,
        ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown',
        user_agent: req.headers['user-agent'] || null,
        request_data: {
          file_info: req.file ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            fieldname: req.file.fieldname
          } : null,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 批量图片上传到OSS
app.post('/api/upload/images', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的图片文件'
      });
    }

    console.log('📸 [API] 批量图片上传请求:', req.files.length, '个文件');

    const result = await uploadMultipleToOSS(req.files);

    console.log('✅ [API] 批量上传完成:', {
      successful: result.successful.length,
      failed: result.failed.length,
      total: result.total
    });

    // 如果有失败的文件，记录错误日志
    if (result.failed && result.failed.length > 0 && logger) {
      await logger.error('upload', 'oss_upload_batch', new Error(`批量上传部分失败: ${result.failed.length}/${result.total} 个文件上传失败`), {
        user_id: req.user?.id || null,
        ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown',
        user_agent: req.headers['user-agent'] || null,
        request_data: {
          total_files: result.total,
          successful_count: result.successful.length,
          failed_count: result.failed.length,
          failed_files: result.failed.map(f => ({
            originalname: f.file?.originalname,
            error: f.error
          })),
          timestamp: new Date().toISOString()
        }
      });
    }

    res.json({
      success: true,
      data: result,
      message: `批量上传完成：成功 ${result.successful.length} 个，失败 ${result.failed.length} 个`
    });

  } catch (error) {
    console.error('❌ [API] 批量图片上传失败:', error.message);
    
    // 记录OSS批量上传错误日志
    if (logger) {
      await logger.error('upload', 'oss_upload_batch', error, {
        user_id: req.user?.id || null,
        ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown',
        user_agent: req.headers['user-agent'] || null,
        request_data: {
          files_info: req.files ? req.files.map(file => ({
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
          })) : [],
          files_count: req.files ? req.files.length : 0,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 生成预签名URL用于前端直传
app.post('/api/upload/presigned-url', async (req, res) => {
  try {
    const { fileName, contentType } = req.body;

    if (!fileName || !contentType) {
      return res.status(400).json({
        success: false,
        message: '文件名和内容类型不能为空'
      });
    }

    console.log('🔗 [API] 生成预签名URL请求:', { fileName, contentType });

    const presignedUrl = await generatePresignedUrl(fileName, contentType);

    console.log('✅ [API] 预签名URL生成成功');
    res.json({
      success: true,
      data: {
        uploadUrl: presignedUrl,
        fileName: fileName
      },
      message: '预签名URL生成成功'
    });

  } catch (error) {
    console.error('❌ [API] 生成预签名URL失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 删除OSS文件
app.delete('/api/upload/file/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;

    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: '文件名不能为空'
      });
    }

    console.log('🗑️ [API] 删除OSS文件请求:', fileName);

    await deleteFromOSS(fileName);

    console.log('✅ [API] 文件删除成功');
    res.json({
      success: true,
      message: '文件删除成功'
    });

  } catch (error) {
    console.error('❌ [API] 删除文件失败:', error.message);
    
    // 记录OSS文件删除错误日志
    if (logger) {
      await logger.error('upload', 'oss_delete_file', error, {
        user_id: req.user?.id || null,
        ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown',
        user_agent: req.headers['user-agent'] || null,
        request_data: {
          file_name: fileName,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== 系统日志管理API ====================

// 获取系统日志列表
app.get('/api/admin/logs', async (req, res) => {
  try {
    if (!dbClient) {
      return res.status(500).json({
        success: false,
        message: '数据库连接失败，请检查数据库配置'
      });
    }

    const { 
      page = 1, 
      limit = 20, 
      log_type, 
      level, 
      module, 
      start_date, 
      end_date,
      search 
    } = req.query;

    console.log('📋 [API] 获取系统日志列表请求:', { page, limit, log_type, level, module, start_date, end_date, search });

    // 构建查询条件
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (log_type) {
      whereConditions.push(`log_type = $${paramIndex++}`);
      queryParams.push(log_type);
    }

    if (level) {
      whereConditions.push(`level = $${paramIndex++}`);
      queryParams.push(level);
    }

    if (module) {
      whereConditions.push(`module = $${paramIndex++}`);
      queryParams.push(module);
    }

    if (start_date) {
      whereConditions.push(`created_at >= $${paramIndex++}`);
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push(`created_at <= $${paramIndex++}`);
      queryParams.push(end_date);
    }

    if (search) {
      whereConditions.push(`(description ILIKE $${paramIndex} OR action ILIKE $${paramIndex + 1} OR error_message ILIKE $${paramIndex + 2})`);
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
      paramIndex += 3;
    }

    // 构建主查询
    let sqlQuery = 'SELECT * FROM system_logs';
    if (whereConditions.length > 0) {
      sqlQuery += ' WHERE ' + whereConditions.join(' AND ');
    }
    sqlQuery += ' ORDER BY created_at DESC';

    // 添加分页
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sqlQuery += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(parseInt(limit), offset);

    // 执行查询
    const result = await dbClient.query(sqlQuery, queryParams);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM system_logs';
    let countParams = [];
    let countParamIndex = 1;

    if (whereConditions.length > 0) {
      const countConditions = [];

      if (log_type) {
        countConditions.push(`log_type = $${countParamIndex++}`);
        countParams.push(log_type);
      }

      if (level) {
        countConditions.push(`level = $${countParamIndex++}`);
        countParams.push(level);
      }

      if (module) {
        countConditions.push(`module = $${countParamIndex++}`);
        countParams.push(module);
      }

      if (start_date) {
        countConditions.push(`created_at >= $${countParamIndex++}`);
        countParams.push(start_date);
      }

      if (end_date) {
        countConditions.push(`created_at <= $${countParamIndex++}`);
        countParams.push(end_date);
      }

      if (search) {
        countConditions.push(`(description ILIKE $${countParamIndex} OR action ILIKE $${countParamIndex + 1} OR error_message ILIKE $${countParamIndex + 2})`);
        const searchPattern = `%${search}%`;
        countParams.push(searchPattern, searchPattern, searchPattern);
        countParamIndex += 3;
      }

      countQuery += ' WHERE ' + countConditions.join(' AND ');
    }

    const countResult = await dbClient.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    console.log(`✅ [API] 获取系统日志成功，共 ${result.rows.length} 条，总计 ${total} 条`);
    res.json({
      success: true,
      data: {
        logs: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('❌ [API] 获取系统日志失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取系统日志统计数据

// 获取系统日志详情
app.get('/api/admin/logs/:id', async (req, res) => {
  try {
    if (!dbClient) {
      return res.status(500).json({
        success: false,
        message: '数据库连接失败，请检查数据库配置'
      });
    }

    const { id } = req.params;
    console.log('📋 [API] 获取系统日志详情请求:', id);

    const result = await dbClient.query(
      'SELECT * FROM system_logs WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '日志记录不存在'
      });
    }

    console.log('✅ [API] 获取系统日志详情成功');
    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ [API] 获取系统日志详情失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});



// 清理过期日志
app.delete('/api/admin/logs/cleanup', async (req, res) => {
  try {
    if (!dbClient) {
      return res.status(500).json({
        success: false,
        message: '数据库连接失败，请检查数据库配置'
      });
    }

    const { days = 30 } = req.body;
    console.log('🧹 [API] 清理过期日志请求:', { days });

    const result = await dbClient.query(
      'DELETE FROM system_logs WHERE created_at < NOW() - INTERVAL $1 RETURNING id',
      [`${parseInt(days)} days`]
    );

    console.log(`✅ [API] 清理过期日志成功，删除了 ${result.rows.length} 条记录`);
    res.json({
      success: true,
      message: `成功清理 ${result.rows.length} 条过期日志记录`
    });

  } catch (error) {
    console.error('❌ [API] 清理过期日志失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== 其他API ====================

// 测试数据库连接
app.post('/api/database/test', async (req, res) => {
  try {
    const config = req.body;
    console.log('🧪 [API] 测试数据库连接请求');

    const testClient = new Client({
      host: config.host || dbConfig.host,
      port: config.port || dbConfig.port,
      database: config.database || dbConfig.database,
      user: config.username || dbConfig.user,
      password: config.password || dbConfig.password,
    });

    await testClient.connect();
    await testClient.query('SELECT 1');
    await testClient.end();

    console.log('✅ [API] 数据库连接测试成功');
    res.json({ success: true, message: '数据库连接成功' });
  } catch (error) {
    console.error('❌ [API] 数据库连接测试失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});



// 获取博客列表
app.get('/api/blogs', async (req, res) => {
  try {
    if (!dbClient) {
      return res.status(500).json({
        success: false,
        message: '数据库连接失败，请检查数据库配置'
      });
    }

    const { page = 1, limit = 10, category, search, published } = req.query;

    console.log('📝 [API] 获取博客列表请求:', { page, limit, category, search, published });

    // 构建查询条件
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (published !== undefined) {
      whereConditions.push(`published = $${paramIndex++}`);
      queryParams.push(published === 'true');
    }

    if (category) {
      whereConditions.push(`category = $${paramIndex++}`);
      queryParams.push(category);
    }

    if (search) {
      whereConditions.push(`(title ILIKE $${paramIndex} OR excerpt ILIKE $${paramIndex + 1} OR $${paramIndex + 2} = ANY(tags))`);
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, search);
      paramIndex += 3;
    }

    // 构建主查询
    let sqlQuery = 'SELECT * FROM blogs';
    if (whereConditions.length > 0) {
      sqlQuery += ' WHERE ' + whereConditions.join(' AND ');
    }
    sqlQuery += ' ORDER BY created_at DESC';

    // 添加分页
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sqlQuery += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(parseInt(limit), offset);

    console.log('🔍 [API] 执行SQL查询:', sqlQuery);
    console.log('📋 [API] 查询参数:', queryParams);

    // 执行查询
    const result = await dbClient.query(sqlQuery, queryParams);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM blogs';
    let countParams = [];
    let countParamIndex = 1;

    if (whereConditions.length > 0) {
      const countConditions = [];

      if (published !== undefined) {
        countConditions.push(`published = $${countParamIndex++}`);
        countParams.push(published === 'true');
      }

      if (category) {
        countConditions.push(`category = $${countParamIndex++}`);
        countParams.push(category);
      }

      if (search) {
        countConditions.push(`(title ILIKE $${countParamIndex} OR excerpt ILIKE $${countParamIndex + 1} OR $${countParamIndex + 2} = ANY(tags))`);
        const searchPattern = `%${search}%`;
        countParams.push(searchPattern, searchPattern, search);
        countParamIndex += 3;
      }

      countQuery += ' WHERE ' + countConditions.join(' AND ');
    }

    const countResult = await dbClient.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    console.log('📊 [API] 数据库查询结果:', result.rows.length, '条记录，总计:', total);

    res.json({
      success: true,
      data: {
        blogs: result.rows,
        total: total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('❌ [API] 获取博客列表失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取博客分类列表 - 必须在 :id 路由之前定义
app.get('/api/blogs/categories', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    console.log('🏷️ [API] 获取博客分类请求');

    // 获取所有不重复的分类（只包含已发布的博客）
    const result = await dbClient.query(
      'SELECT DISTINCT category FROM blogs WHERE category IS NOT NULL AND  published = true AND category != \'\' ORDER BY category'
    );
    console.log('✅ [API] 博客分类获取成功:result', result);
    const categories = result.rows.map(row => row.category);

    console.log('✅ [API] 博客分类获取成功:', categories);

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('❌ [API] 获取博客分类失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 根据ID获取博客
app.get('/api/blogs/:id', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { id } = req.params;
    console.log('📖 [API] 获取博客详情请求:', id);

    const result = await dbClient.query('SELECT * FROM blogs WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '博客不存在'
      });
    }

    console.log('✅ [API] 博客详情获取成功');
    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ [API] 获取博客详情失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 增加博客阅读次数（带IP限制）
app.post('/api/blogs/:id/view', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { id } = req.params;
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.get('User-Agent') || '';

    console.log('👁️ [API] 增加博客阅读次数:', { blog_id: id, ip: clientIP });

    // 检查该IP在5分钟内是否已经浏览过该博客
    const recentView = await dbClient.query(
      'SELECT id FROM blog_views WHERE blog_id = $1 AND ip_address = $2 AND created_at > CURRENT_TIMESTAMP - INTERVAL \'5 minutes\'',
      [id, clientIP]
    );

    if (recentView.rows.length > 0) {
      console.log('⚠️ [API] IP限制：该IP在5分钟内已浏览过该博客');
      const currentViews = await dbClient.query('SELECT views FROM blogs WHERE id = $1', [id]);
      return res.status(200).json({
        success: true,
        data: { views: currentViews.rows[0]?.views || 0 },
        message: '浏览记录已存在'
      });
    }

    // 记录浏览
    await dbClient.query(
      'INSERT INTO blog_views (blog_id, ip_address, user_agent) VALUES ($1, $2, $3)',
      [id, clientIP, userAgent]
    );

    const result = await dbClient.query(
      'UPDATE blogs SET views = COALESCE(views, 0) + 1 WHERE id = $1 RETURNING views',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '博客不存在'
      });
    }

    console.log('✅ [API] 阅读次数增加成功，当前浏览数:', result.rows[0].views);
    res.json({
      success: true,
      data: { views: result.rows[0].views }
    });

  } catch (error) {
    console.error('❌ [API] 增加阅读次数失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});



// 获取推荐内容（主页用）
app.get('/api/featured', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    console.log('⭐ [API] 获取推荐内容请求');

    // 获取推荐博客（最多2篇）
    const blogsResult = await dbClient.query(
      'SELECT * FROM blogs WHERE featured = true AND published = true ORDER BY created_at DESC LIMIT 2'
    );

    // 获取推荐作品（最多3个）
    const worksResult = await dbClient.query(
      'SELECT * FROM works WHERE featured = true ORDER BY created_at DESC LIMIT 3'
    );

    console.log('✅ [API] 推荐内容获取成功:', {
      blogs: blogsResult.rows.length,
      works: worksResult.rows.length
    });

    res.json({
      success: true,
      data: {
        blogs: blogsResult.rows,
        works: worksResult.rows
      }
    });

  } catch (error) {
    console.error('❌ [API] 获取推荐内容失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取作品列表
app.get('/api/works', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { page = 1, limit = 10, category, status } = req.query;

    console.log('🎨 [API] 获取作品列表请求:', { page, limit, category, status });

    // 构建查询条件
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (status) {
      whereConditions.push(`status = $${paramIndex++}`);
      queryParams.push(status);
    }

    if (category) {
      whereConditions.push(`category = $${paramIndex++}`);
      queryParams.push(category);
    }

    // 构建主查询
    let sqlQuery = 'SELECT * FROM works';
    if (whereConditions.length > 0) {
      sqlQuery += ' WHERE ' + whereConditions.join(' AND ');
    }
    sqlQuery += ' ORDER BY created_at DESC';

    // 添加分页
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sqlQuery += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(parseInt(limit), offset);

    // 执行查询
    const result = await dbClient.query(sqlQuery, queryParams);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM works';
    let countParams = [];
    let countParamIndex = 1;

    if (whereConditions.length > 0) {
      const countConditions = [];

      if (status) {
        countConditions.push(`status = $${countParamIndex++}`);
        countParams.push(status);
      }

      if (category) {
        countConditions.push(`category = $${countParamIndex++}`);
        countParams.push(category);
      }

      countQuery += ' WHERE ' + countConditions.join(' AND ');
    }

    const countResult = await dbClient.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    console.log('📊 [API] 作品查询结果:', result.rows.length, '条记录，总计:', total);

    res.json({
      success: true,
      data: {
        works: result.rows,
        total: total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('❌ [API] 获取作品列表失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取作品分类列表
app.get('/api/works/categories', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    console.log('📂 [API] 获取作品分类列表请求');

    // 只返回active和completed状态作品的分类
    const result = await dbClient.query(
      'SELECT DISTINCT category FROM works WHERE category IS NOT NULL AND (status = \'active\' OR status = \'completed\') ORDER BY category'
    );

    // 添加"全部"选项
    const categories = ['全部', ...result.rows.map(row => row.category)];

    console.log('✅ [API] 作品分类列表获取成功:', categories);
    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('❌ [API] 获取作品分类列表失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 根据ID获取作品详情
app.get('/api/works/:id', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { id } = req.params;
    console.log('🎨 [API] 获取作品详情请求:', id);

    const result = await dbClient.query('SELECT * FROM works WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '作品不存在'
      });
    }

    console.log('✅ [API] 作品详情获取成功');
    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ [API] 获取作品详情失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 创建新作品
app.post('/api/works', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const {
      title, description, content, category, status, tags, technologies,
      project_url, github_url, cover_image, screenshots, features, challenges, featured
    } = req.body;

    console.log('🎨 [API] 创建作品请求:', { title, category, status });

    const result = await dbClient.query(
      `INSERT INTO works (
        title, description, content, category, status, tags, technologies,
        project_url, github_url, cover_image, screenshots, features, challenges, featured
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
      RETURNING *`,
      [
        title, description, content, category, status || 'active', tags || [],
        technologies || [], project_url, github_url, cover_image,
        screenshots || [], features || [], challenges || [], featured || false
      ]
    );

    console.log('✅ [API] 作品创建成功');
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ [API] 创建作品失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 更新作品
app.put('/api/works/:id', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { id } = req.params;
    const {
      title, description, content, category, status, tags, technologies,
      project_url, github_url, cover_image, screenshots, features, challenges, featured
    } = req.body;

    console.log('🎨 [API] 更新作品请求:', { id, title, category, status });

    const result = await dbClient.query(
      `UPDATE works SET 
        title = $1, description = $2, content = $3, category = $4, status = $5,
        tags = $6, technologies = $7, project_url = $8, github_url = $9,
        cover_image = $10, screenshots = $11, features = $12, challenges = $13,
        featured = $14, updated_at = CURRENT_TIMESTAMP
      WHERE id = $15 RETURNING *`,
      [
        title, description, content, category, status, tags || [],
        technologies || [], project_url, github_url, cover_image,
        screenshots || [], features || [], challenges || [], featured || false, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '作品不存在'
      });
    }

    console.log('✅ [API] 作品更新成功');
    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ [API] 更新作品失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 删除作品
app.delete('/api/works/:id', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { id } = req.params;
    console.log('🎨 [API] 删除作品请求:', id);

    const result = await dbClient.query('DELETE FROM works WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '作品不存在'
      });
    }

    console.log('✅ [API] 作品删除成功');
    res.json({
      success: true,
      message: '作品删除成功'
    });

  } catch (error) {
    console.error('❌ [API] 删除作品失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 切换作品精选状态
app.put('/api/works/:id/featured', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { id } = req.params;
    const { featured } = req.body;

    console.log('🎨 [API] 切换作品精选状态请求:', { id, featured });

    const result = await dbClient.query(
      'UPDATE works SET featured = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [featured, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '作品不存在'
      });
    }

    console.log('✅ [API] 作品精选状态切换成功');
    res.json({
      success: true,
      data: result.rows[0],
      message: featured ? '已设为精选' : '已取消精选'
    });

  } catch (error) {
    console.error('❌ [API] 切换作品精选状态失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 创建新博客
app.post('/api/blogs', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const {
      title, content, excerpt, category, tags, published, featured, cover_image
    } = req.body;

    console.log('📝 [API] 创建博客请求:', { title, category, published });

    const result = await dbClient.query(
      `INSERT INTO blogs (
        title, content, excerpt, category, tags, published, featured, cover_image
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`,
      [
        title, content, excerpt, category, tags || [], published || false,
        featured || false, cover_image
      ]
    );

    console.log('✅ [API] 博客创建成功');
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ [API] 创建博客失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 更新博客
app.put('/api/blogs/:id', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { id } = req.params;
    const {
      title, content, excerpt, category, tags, published, featured, cover_image
    } = req.body;

    console.log('📝 [API] 更新博客请求:', { id, title, category, published });

    const result = await dbClient.query(
      `UPDATE blogs SET 
        title = $1, content = $2, excerpt = $3, category = $4, tags = $5,
        published = $6, featured = $7, cover_image = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9 RETURNING *`,
      [
        title, content, excerpt, category, tags || [], published || false,
        featured || false, cover_image, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '博客不存在'
      });
    }

    console.log('✅ [API] 博客更新成功');
    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ [API] 更新博客失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 删除博客
app.delete('/api/blogs/:id', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { id } = req.params;
    console.log('📝 [API] 删除博客请求:', id);

    const result = await dbClient.query('DELETE FROM blogs WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '博客不存在'
      });
    }

    console.log('✅ [API] 博客删除成功');
    res.json({
      success: true,
      message: '博客删除成功'
    });

  } catch (error) {
    console.error('❌ [API] 删除博客失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 用户注册
app.post('/api/auth/register', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { username, email, password, bio } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名、邮箱和密码不能为空'
      });
    }

    console.log('👤 [API] 用户注册请求:', { username, email });

    // 检查用户名是否已存在
    const existingUser = await dbClient.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: '用户名或邮箱已存在'
      });
    }

    // 加密密码
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 创建用户
    const result = await dbClient.query(
      `INSERT INTO users (username, email, password_hash, bio) 
       VALUES ($1, $2, $3, $4) RETURNING id, username, email, bio, created_at`,
      [username, email, passwordHash, bio || '']
    );

    console.log('✅ [API] 用户注册成功');
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: '注册成功'
    });

  } catch (error) {
    console.error('❌ [API] 用户注册失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 用户登录
app.post('/api/auth/login', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    console.log('🔐 [API] 用户登录请求:', { username });

    // 查找用户
    const result = await dbClient.query(
      'SELECT id, username, email, password_hash, bio, avatar, created_at FROM users WHERE username = $1 OR email = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    const user = result.rows[0];

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 返回用户信息（不包含密码）
    const { password_hash, ...userInfo } = user;

    console.log('✅ [API] 用户登录成功');
    res.json({
      success: true,
      data: userInfo,
      message: '登录成功'
    });

  } catch (error) {
    console.error('❌ [API] 用户登录失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取用户列表（管理员用）
app.get('/api/users', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    console.log('👥 [API] 获取用户列表请求');

    const result = await dbClient.query(
      'SELECT id, username, email, bio, avatar, created_at FROM users ORDER BY created_at DESC'
    );

    console.log('✅ [API] 用户列表获取成功:', result.rows.length, '个用户');
    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('❌ [API] 获取用户列表失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 修改密码
app.put('/api/users/:id/password', async (req, res) => {

  const saltRounds = 10;
  const newPasswordHash = await bcrypt.hash('123456', saltRounds);
  console.log('newPasswordHash:', newPasswordHash);
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    console.log('🔐 [API] 修改密码请求:', { id });

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '当前密码和新密码不能为空'
      });
    }

    // 获取用户当前密码哈希
    const userResult = await dbClient.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    console.log('userResult:', userResult);
    // 验证当前密码
    const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);

    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: '当前密码不正确'
      });
    }

    // 加密新密码
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // 更新密码
    const updateResult = await dbClient.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, email',
      [newPasswordHash, id]
    );

    console.log('✅ [API] 密码修改成功');
    res.json({
      success: true,
      data: updateResult.rows[0],
      message: '密码修改成功'
    });

  } catch (error) {
    console.error('❌ [API] 修改密码失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取单个用户信息
app.get('/api/users/:id', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { id } = req.params;
    console.log('👤 [API] 获取用户信息请求:', id);

    const result = await dbClient.query(
      'SELECT id, username, email, bio, avatar, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    console.log('✅ [API] 用户信息获取成功:', result.rows[0].username);
    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ [API] 获取用户信息失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});








// ================================================
// 富媒体动态模块 API
// ================================================

// 获取动态列表
app.get('/api/moments', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { page = 1, limit = 10, sort = 'created_at', include_private = 'false' } = req.query;
    console.log('📱 [API] 获取动态列表请求:', { page, limit, sort, include_private });

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 根据include_private参数决定查询条件
    const includePrivate = include_private === 'true';
    const whereClause = includePrivate ? '' : "WHERE visibility = 'public'";
    const countWhereClause = includePrivate ? '' : "WHERE visibility = 'public'";

    // 获取动态列表（包含图片）
    const result = await dbClient.query(
      `SELECT 
        id,
        content,
        author_id,
        visibility,
        created_at,
        updated_at,
        CASE 
          WHEN images IS NOT NULL AND images != '' 
          THEN string_to_array(images, ',')
          ELSE ARRAY[]::text[]
        END as images
      FROM moments
      ${whereClause}
      ORDER BY ${sort} DESC
      LIMIT $1 OFFSET $2`,
      [parseInt(limit), offset]
    );

    // 获取总数
    const countResult = await dbClient.query(
      `SELECT COUNT(*) as total FROM moments ${countWhereClause}`
    );
    const total = parseInt(countResult.rows[0].total);

    console.log('✅ [API] 动态列表获取成功，共', result.rows.length, '条');
    res.json({
      success: true,
      data: {
        moments: result.rows,
        total: total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('❌ [API] 获取动态列表失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 根据ID获取动态详情
app.get('/api/moments/:id', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { id } = req.params;
    console.log('📱 [API] 获取动态详情请求:', id);

    // 获取动态详情（包含图片）
    const result = await dbClient.query(
      `SELECT 
        id,
        content,
        author_id,
        visibility,
        created_at,
        updated_at,
        CASE 
          WHEN images IS NOT NULL AND images != '' 
          THEN string_to_array(images, ',')
          ELSE ARRAY[]::text[]
        END as images
      FROM moments
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '动态不存在'
      });
    }

    console.log('✅ [API] 动态详情获取成功');
    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ [API] 获取动态详情失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 创建新动态
app.post('/api/moments', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { content, images = [], visibility = 'public' } = req.body;
    console.log('📱 [API] 创建动态请求:', { content: content?.substring(0, 50) + '...', images_count: images.length });

    if (!content) {
      return res.status(400).json({
        success: false,
        message: '动态内容不能为空'
      });
    }

    // 处理图片数组，转换为逗号分隔的字符串
    let imageUrls = '';
    if (images.length > 0) {
      // 提取图片URL
      const urls = images.map(img => {
        if (typeof img === 'string') {
          return img;
        } else if (img.image_url) {
          return img.image_url;
        } else if (img.url) {
          return img.url;
        }
        return null;
      }).filter(url => url !== null);
      
      imageUrls = urls.join(',');
    }

    // 创建动态
    const momentResult = await dbClient.query(
      'INSERT INTO moments (content, images, visibility) VALUES ($1, $2, $3) RETURNING *',
      [content, imageUrls, visibility]
    );

    console.log('✅ [API] 动态创建成功，ID:', momentResult.rows[0].id);
    res.status(201).json({
      success: true,
      data: {
        ...momentResult.rows[0],
        images: imageUrls ? imageUrls.split(',') : []
      },
      message: '动态创建成功'
    });

  } catch (error) {
    console.error('❌ [API] 创建动态失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 更新动态
app.put('/api/moments/:id', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { id } = req.params;
    const { content, images = [], visibility } = req.body;
    console.log('📱 [API] 更新动态请求:', { id, content: content?.substring(0, 50) + '...' });

    if (!content) {
      return res.status(400).json({
        success: false,
        message: '动态内容不能为空'
      });
    }

    // 处理图片数组，转换为逗号分隔的字符串
    let imageUrls = '';
    if (images.length > 0) {
      // 提取图片URL
      const urls = images.map(img => {
        if (typeof img === 'string') {
          return img;
        } else if (img.image_url) {
          return img.image_url;
        } else if (img.url) {
          return img.url;
        }
        return null;
      }).filter(url => url !== null);
      
      imageUrls = urls.join(',');
    }

    // 更新动态
    const updateFields = ['content = $1', 'images = $2'];
    const updateValues = [content, imageUrls];
    let paramIndex = 3;

    if (visibility !== undefined) {
      updateFields.push(`visibility = $${paramIndex++}`);
      updateValues.push(visibility);
    }

    updateValues.push(id);
    const updateQuery = `UPDATE moments SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`;

    const result = await dbClient.query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '动态不存在'
      });
    }

    console.log('✅ [API] 动态更新成功');
    res.json({
      success: true,
      data: {
        ...result.rows[0],
        images: imageUrls ? imageUrls.split(',') : []
      },
      message: '动态更新成功'
    });

  } catch (error) {
    console.error('❌ [API] 更新动态失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 删除动态
app.delete('/api/moments/:id', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { id } = req.params;
    console.log('📱 [API] 删除动态请求:', id);

    const result = await dbClient.query('DELETE FROM moments WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '动态不存在'
      });
    }

    console.log('✅ [API] 动态删除成功');
    res.json({
      success: true,
      message: '动态删除成功'
    });

  } catch (error) {
    console.error('❌ [API] 删除动态失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});










// ==================== 照片管理API ====================

// 获取照片列表（支持分页、分类筛选、搜索）
app.get('/api/photos', async (req, res) => {
  try {
    if (!dbClient) {
      return res.status(500).json({
        success: false,
        message: '数据库连接失败，请检查数据库配置'
      });
    }

    const { 
      page = 1, 
      limit = 20, 
      category, 
      search,
      published = 'true'
    } = req.query;

    console.log('📸 [API] 获取照片列表请求:', { page, limit, category, search, published });

    // 构建查询条件
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // 只显示已发布的照片（前端访问）
    if (published === 'true') {
      whereConditions.push(`published = $${paramIndex++}`);
      queryParams.push(true);
    }

    if (category && category !== '全部') {
      whereConditions.push(`category = $${paramIndex++}`);
      queryParams.push(category);
    }

    if (search) {
      whereConditions.push(`(title ILIKE $${paramIndex++} OR description ILIKE $${paramIndex} OR location ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // 构建主查询
    let sqlQuery = 'SELECT * FROM photos';
    if (whereConditions.length > 0) {
      sqlQuery += ' WHERE ' + whereConditions.join(' AND ');
    }
    sqlQuery += ' ORDER BY taken_at DESC, created_at DESC';

    // 添加分页
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sqlQuery += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(parseInt(limit), offset);

    // 执行查询
    const result = await dbClient.query(sqlQuery, queryParams);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM photos';
    let countParams = [];
    let countParamIndex = 1;

    if (whereConditions.length > 0) {
      const countConditions = [];

      if (published === 'true') {
        countConditions.push(`published = $${countParamIndex++}`);
        countParams.push(true);
      }

      if (category && category !== '全部') {
        countConditions.push(`category = $${countParamIndex++}`);
        countParams.push(category);
      }

      if (search) {
        countConditions.push(`(title ILIKE $${countParamIndex++} OR description ILIKE $${countParamIndex} OR location ILIKE $${countParamIndex})`);
        countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      countQuery += ' WHERE ' + countConditions.join(' AND ');
    }

    const countResult = await dbClient.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    console.log('📊 [API] 照片查询结果:', result.rows.length, '条记录，总计:', total);

    res.json({
      success: true,
      data: {
        photos: result.rows,
        total: total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('❌ [API] 获取照片列表失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取照片分类列表 - 必须在 :id 路由之前定义
app.get('/api/photos/categories', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    console.log('📂 [API] 获取照片分类列表请求');

    // 只返回已发布照片的分类
    const result = await dbClient.query(
      'SELECT DISTINCT category FROM photos WHERE category IS NOT NULL AND published = true ORDER BY category'
    );

    // 添加"全部"选项
    const categories = ['全部', ...result.rows.map(row => row.category)];

    console.log('✅ [API] 照片分类列表获取成功:', categories);
    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('❌ [API] 获取照片分类列表失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 根据ID获取照片详情
app.get('/api/photos/:id', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { id } = req.params;
    console.log('📸 [API] 获取照片详情请求:', id);

    const result = await dbClient.query('SELECT * FROM photos WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '照片不存在'
      });
    }

    console.log('✅ [API] 照片详情获取成功');
    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ [API] 获取照片详情失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 创建新照片
app.post('/api/photos', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const {
      title, description, image_url, thumbnail_url, category,
      location, taken_at, published
    } = req.body;

    console.log('📸 [API] 创建照片请求:', { title, category, published });

    // 验证必填字段
    if (!title || !image_url) {
      return res.status(400).json({
        success: false,
        message: '标题和图片URL不能为空'
      });
    }

    const result = await dbClient.query(
      `INSERT INTO photos (
        title, description, image_url, thumbnail_url, category,
        location, taken_at, published
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`,
      [
        title, description, image_url, thumbnail_url, category,
        location, taken_at, published !== undefined ? published : true
      ]
    );

    console.log('✅ [API] 照片创建成功');
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ [API] 创建照片失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 更新照片
app.put('/api/photos/:id', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { id } = req.params;
    const {
      title, description, image_url, thumbnail_url, category,
      location, taken_at, published
    } = req.body;

    console.log('📸 [API] 更新照片请求:', { id, title, category, published });

    // 验证必填字段
    if (!title || !image_url) {
      return res.status(400).json({
        success: false,
        message: '标题和图片URL不能为空'
      });
    }

    const result = await dbClient.query(
      `UPDATE photos SET 
        title = $1, description = $2, image_url = $3, thumbnail_url = $4,
        category = $5, location = $6, taken_at = $7, published = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9 RETURNING *`,
      [
        title, description, image_url, thumbnail_url, category,
        location, taken_at, published, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '照片不存在'
      });
    }

    console.log('✅ [API] 照片更新成功');
    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ [API] 更新照片失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 删除照片
app.delete('/api/photos/:id', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { id } = req.params;
    console.log('📸 [API] 删除照片请求:', id);

    const result = await dbClient.query('DELETE FROM photos WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '照片不存在'
      });
    }

    console.log('✅ [API] 照片删除成功');
    res.json({
      success: true,
      data: result.rows[0],
      message: '照片删除成功'
    });

  } catch (error) {
    console.error('❌ [API] 删除照片失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 批量删除照片
app.delete('/api/photos', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要删除的照片ID列表'
      });
    }

    console.log('📸 [API] 批量删除照片请求:', ids);

    // 构建占位符
    const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
    const result = await dbClient.query(
      `DELETE FROM photos WHERE id IN (${placeholders}) RETURNING *`,
      ids
    );

    console.log('✅ [API] 批量删除照片成功:', result.rows.length, '张照片');
    res.json({
      success: true,
      data: result.rows,
      message: `成功删除 ${result.rows.length} 张照片`
    });

  } catch (error) {
    console.error('❌ [API] 批量删除照片失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 前端日志记录API
app.post('/api/logs/frontend', async (req, res) => {
  try {
    const {
      log_type = 'error',
      level = 'error',
      module = 'frontend',
      action,
      description,
      error_message,
      file_info,
      user_info,
      additional_data
    } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        message: '日志描述不能为空'
      });
    }

    // 构建详细的日志数据
    const logData = {
      error_message,
      file_info,
      user_info,
      additional_data,
      ip_address: req.ip || req.connection.remoteAddress || 'unknown',
      user_agent: req.headers['user-agent'] || null,
      timestamp: new Date().toISOString(),
      browser_info: {
        user_agent: req.headers['user-agent'],
        referer: req.headers['referer'],
        origin: req.headers['origin'],
        accept: req.headers['accept'],
        accept_language: req.headers['accept-language'],
        accept_encoding: req.headers['accept-encoding']
      },
      request_info: {
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        secure: req.secure,
        xhr: req.xhr
      }
    };

    // 针对响应解析错误的特殊处理
    if (additional_data?.responseText) {
      logData.response_debug_info = {
        response_length: additional_data.responseLength || 0,
        response_preview: additional_data.responseText?.substring(0, 200),
        response_full: additional_data.responseText?.length <= 1000 ? additional_data.responseText : additional_data.responseText?.substring(0, 1000) + '...(truncated)',
        is_json_parseable: (() => {
          try {
            JSON.parse(additional_data.responseText);
            return true;
          } catch {
            return false;
          }
        })(),
        content_type_detected: (() => {
          const text = additional_data.responseText;
          if (!text) return 'empty';
          if (text.trim().startsWith('{') || text.trim().startsWith('[')) return 'json-like';
          if (text.trim().startsWith('<')) return 'html-like';
          if (text.trim().startsWith('<!DOCTYPE')) return 'html-document';
          return 'text';
        })(),
        starts_with: additional_data.responseText?.substring(0, 50),
        ends_with: additional_data.responseText?.length > 50 ? additional_data.responseText?.substring(additional_data.responseText.length - 50) : null
      };
    }

    // 使用logger记录前端日志
    if (logger) {
      await logger.error(module, action || 'frontend_error', description, logData);
    }

    console.log('📝 [API] 前端日志记录成功:', {
      module,
      action,
      description,
      hasResponseDebugInfo: !!logData.response_debug_info
    });

    res.json({
      success: true,
      message: '日志记录成功'
    });

  } catch (error) {
    console.error('❌ [API] 前端日志记录失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: dbClient ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// 错误处理中间件（必须放在所有路由之后）
app.use((error, req, res, next) => {
  if (dbClient && logger) {
    // 异步记录错误日志
    setImmediate(() => {
      logger.error('server', `${req.method} ${req.path}`, error, {
        user_id: req.user?.id || null,
        ip_address: req.ip || req.connection.remoteAddress || 'unknown',
        user_agent: req.headers['user-agent'] || null,
        request_data: {
          query: req.query,
          body: req.body,
          params: req.params
        }
      });
    });
  }
  
  console.error('❌ [Server] 未处理的错误:', error.message);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 [服务器] 后端API服务器启动成功`);
  console.log(`📍 [服务器] 地址: http://localhost:${PORT}`);
  console.log(`🔗 [服务器] API文档:`);
  console.log(`   - GET  /api/health            - 健康检查`);
  console.log(`   - POST /api/database/test     - 测试数据库连接`);
  console.log(`   - POST /api/auth/register     - 用户注册`);
  console.log(`   - POST /api/auth/login        - 用户登录`);
  console.log(`   - GET  /api/users             - 获取用户列表`);
  console.log(`   - GET  /api/blogs             - 获取博客列表`);
  console.log(`   - GET  /api/blogs/categories  - 获取博客分类列表`);
  console.log(`   - GET  /api/blogs/:id         - 获取博客详情`);
  console.log(`   - GET  /api/works             - 获取作品列表`);
  console.log(`   - GET  /api/works/categories  - 获取作品分类列表`);
  console.log(`   - GET  /api/works/:id         - 获取作品详情`);
  console.log(`   - GET  /api/featured          - 获取推荐内容（主页用）`);
});

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🛑 [服务器] 正在关闭服务器...');
  if (dbClient) {
    await dbClient.end();
    console.log('✅ [数据库] 数据库连接已关闭');
  }
  process.exit(0);
});