import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { getClientIp } from './utils/clientIp.js';
import { createViewTrackingRouter } from './routes/viewTrackingRouter.js';
import {
  uploadToOSS,
  uploadMultipleToOSS,
  generatePresignedUrl,
  validateFileType,
  deleteFromOSS
} from './utils/ossConfig.js';
import { requestLogMiddleware, errorLogMiddleware, createLogger } from './utils/logMiddleware.js';
import { createChatRouter } from './routes/chatRouter.js';
import { createKnowledgeBaseRouter } from './routes/knowledgeBaseRouter.js';
import { createPromptRouter } from './routes/promptRouter.js';
import { createAIRouter } from './routes/aiRouter.js';
import { createAiSignalRouter } from './routes/aiSignalRouter.js';
import { createOpenClawReportsRouter } from './routes/openclawReportsRouter.js';
import { createDataCenterRouter } from './routes/dataCenterRouter.js';
import { scheduleAiSignalJob } from './jobs/aiSignalJob.js';
import { createOptionalAuthMiddleware, createRequireAuthMiddleware } from './middleware/authMiddleware.js';

// 导入模块化路由
import {
  createBlogsRouter,
  createWorksRouter,
  createMomentsRouter,
  createPhotosRouter,
  createAuthRouter,
  createUsersRouter,
  createAdminRouter,
  createExternalRouter
} from './routes/index.js';

// 导入每日想法路由
import memoryRouter from './routes/memoryRouter.js';
import { setMemoryDbClientGetter } from './services/MemoryService.js';
import { setTaskDbClientGetter } from './services/TaskService.js';
import { setTaskParseDbClientGetter } from './services/TaskParseService.js';
import dailyReportRouter from './routes/dailyReportRouter.js';
import { setDailyReportDbClientGetter } from './services/DailyReportService.js';

// ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;
const app = express();
const PORT = process.env.PORT || 3006;

const trustProxyEnabled = String(process.env.TRUST_PROXY || 'true').toLowerCase() !== 'false';
const trustProxyHops = Number.parseInt(process.env.TRUST_PROXY_HOPS || '2', 10);
app.set('trust proxy', trustProxyEnabled ? (Number.isNaN(trustProxyHops) ? 2 : trustProxyHops) : false);

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

// 创建数据库连接
let dbClient = null;
let logger = null;

// 连接数据库
async function connectDatabase() {
  try {
    dbClient = new Client(dbConfig);
    await dbClient.connect();
    console.log('✅ [数据库] PostgreSQL连接成功');

    logger = createLogger(dbClient);
    await logger.system('server', 'startup', '服务器启动，数据库连接成功');
    scheduleAiSignalJob(() => dbClient, logger);

    return true;
  } catch (error) {
    console.error('❌ [数据库] PostgreSQL连接失败:', error.message);
    dbClient = null;
    return false;
  }
}

// 启动时连接数据库
connectDatabase();

// 获取数据库客户端的工厂函数
const getDbClient = () => dbClient;
const getLogger = () => logger;
const optionalAuthMiddleware = createOptionalAuthMiddleware(getDbClient);
const requireAuthMiddleware = createRequireAuthMiddleware(getDbClient);
const viewTrackingRouter = createViewTrackingRouter(getDbClient);
setMemoryDbClientGetter(getDbClient);
setTaskDbClientGetter(getDbClient);
setTaskParseDbClientGetter(getDbClient);
setDailyReportDbClientGetter(getDbClient);

// 添加日志中间件
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

// ==================== 统一浏览上报接口 ====================
app.use('/api/view', (req, res, next) => {
  if (!dbClient) {
    return res.status(503).json({ success: false, message: 'Database not connected' });
  }
  viewTrackingRouter(req, res, next);
});

// ==================== 挂载模块化路由 ====================

// AI 聊天相关API
app.use('/api/chat', (req, res, next) => {
  if (!dbClient) {
    return res.status(503).json({ success: false, message: 'Database not connected' });
  }
  createChatRouter(() => dbClient)(req, res, next);
});

// 知识库管理相关API
app.use('/api/knowledge-base', (req, res, next) => {
  if (!dbClient) {
    return res.status(503).json({ success: false, message: 'Database not connected' });
  }
  createKnowledgeBaseRouter(() => dbClient)(req, res, next);
});

// 提示词配置相关API
app.use('/api/prompts', (req, res, next) => {
  if (!dbClient) {
    return res.status(503).json({ success: false, message: 'Database not connected' });
  }
  createPromptRouter(() => dbClient)(req, res, next);
});

// AI 通用服务API
app.use('/api/ai', (req, res, next) => {
  if (!dbClient) {
    return res.status(503).json({ success: false, message: 'Database not connected' });
  }
  createAIRouter(() => dbClient)(req, res, next);
});

// AI 情报信号API
app.use('/api/ai-signal', (req, res, next) => {
  if (!dbClient) {
    return res.status(503).json({ success: false, message: 'Database not connected' });
  }
  createAiSignalRouter(() => dbClient)(req, res, next);
});

// 博客相关API
app.use('/api/blogs', optionalAuthMiddleware, createBlogsRouter(getDbClient));

// 作品相关API
app.use('/api/works', createWorksRouter(getDbClient));

// 动态相关API
app.use('/api/moments', optionalAuthMiddleware, createMomentsRouter(getDbClient));

// 照片相关API
app.use('/api/photos', createPhotosRouter(getDbClient));

// 认证相关API
app.use('/api/auth', createAuthRouter(getDbClient));

// 用户管理API
app.use('/api/users', createUsersRouter(getDbClient));

// 数据中心 API
app.use('/api/admin/data-center', requireAuthMiddleware, createDataCenterRouter(getDbClient));

// 管理后台API
app.use('/api/admin', requireAuthMiddleware, createAdminRouter(getDbClient, getLogger));

// 每日想法 API
app.use('/api', memoryRouter);
// 每日工作总结 API
app.use('/api', dailyReportRouter);

// Task Force API (任务/项目管理)
import taskRouter from './routes/taskRouter.js';
app.use('/api/tasks', taskRouter);

// 外部API（用于OpenClaw等外部系统推送数据）
app.use('/api/external', createExternalRouter(getDbClient));

// OpenClaw 汇报查看API（Dashboard使用）
app.use('/api/openclaw-reports', (req, res, next) => {
  if (!dbClient) {
    return res.status(503).json({ success: false, message: 'Database not connected' });
  }
  createOpenClawReportsRouter(() => dbClient)(req, res, next);
});

// ==================== 图片上传相关API ====================

// 单个图片上传到OSS
app.post('/api/upload/image', (req, res, next) => {
  console.log('🔍 [API] 收到图片上传请求:', {
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length')
  });
  next();
}, upload.single('image'), async (req, res) => {
  try {
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

    if (logger) {
      await logger.error('upload', 'oss_upload_single', error, {
        user_id: req.user?.id || null,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'] || null
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

    res.json({
      success: true,
      data: result,
      message: `批量上传完成：成功 ${result.successful.length} 个，失败 ${result.failed.length} 个`
    });

  } catch (error) {
    console.error('❌ [API] 批量图片上传失败:', error.message);
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== 其他API ====================

// 获取推荐内容（主页用）
app.get('/api/featured', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    console.log('⭐ [API] 获取推荐内容请求');

    const blogsResult = await dbClient.query(
      'SELECT * FROM blogs WHERE featured = true AND published = true ORDER BY created_at DESC LIMIT 2'
    );

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

    const logData = {
      error_message,
      file_info,
      user_info,
      additional_data,
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent'] || null,
      timestamp: new Date().toISOString()
    };

    if (logger) {
      await logger.error(module, action || 'frontend_error', description, logData);
    }

    console.log('📝 [API] 前端日志记录成功:', { module, action, description });
    res.json({ success: true, message: '日志记录成功' });

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
    setImmediate(() => {
      logger.error('server', `${req.method} ${req.path}`, error, {
        user_id: req.user?.id || null,
        ip_address: getClientIp(req),
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
  console.log(`   - GET  /api/thoughts          - 每日想法`);
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
