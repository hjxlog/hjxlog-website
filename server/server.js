import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const { Client } = pg;
const app = express();
const PORT = process.env.PORT || 3006;

// 中间件
app.use(cors());
app.use(express.json());

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

// 连接数据库
async function connectDatabase() {
  try {
    dbClient = new Client(dbConfig);
    await dbClient.connect();
    return true;
  } catch (error) {
    console.error('❌ [数据库] PostgreSQL连接失败:', error.message);
    dbClient = null;
    return false;
  }
}

// 启动时连接数据库
connectDatabase();

// API路由

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

// 获取所有评论（管理员用）
app.get('/api/comments', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    console.log('📋 [API] 获取所有评论请求');

    const result = await dbClient.query(
      `SELECT c.*, b.title as blog_title 
       FROM comments c 
       LEFT JOIN blogs b ON c.blog_id = b.id 
       ORDER BY c.created_at DESC`
    );

    console.log(`✅ [API] 获取评论成功，共 ${result.rows.length} 条`);
    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('❌ [API] 获取评论失败:', error.message);
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

    // 获取所有不重复的分类
    const result = await dbClient.query(
      'SELECT DISTINCT category FROM blogs WHERE category IS NOT NULL AND category != \'\' ORDER BY category'
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

// 博客点赞（带IP限制）
app.post('/api/blogs/:id/like', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { id } = req.params;
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.get('User-Agent') || '';

    console.log('❤️ [API] 博客点赞请求:', { blog_id: id, ip: clientIP });

    // 检查该IP在10分钟内是否已经点赞过
    const recentLike = await dbClient.query(
      'SELECT id FROM blog_likes WHERE blog_id = $1 AND ip_address = $2 AND created_at > CURRENT_TIMESTAMP - INTERVAL \'10 minutes\'',
      [id, clientIP]
    );

    if (recentLike.rows.length > 0) {
      console.log('⚠️ [API] IP限制：该IP在10分钟内已点赞过');
      const currentLikes = await dbClient.query('SELECT likes FROM blogs WHERE id = $1', [id]);
      return res.status(200).json({
        success: false,
        likes: currentLikes.rows[0]?.likes || 0,
        message: '您已经点过赞了，请10分钟后再试'
      });
    }

    // 记录点赞
    await dbClient.query(
      'INSERT INTO blog_likes (blog_id, ip_address, user_agent) VALUES ($1, $2, $3)',
      [id, clientIP, userAgent]
    );

    const result = await dbClient.query(
      'UPDATE blogs SET likes = COALESCE(likes, 0) + 1 WHERE id = $1 RETURNING likes',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '博客不存在'
      });
    }

    console.log('✅ [API] 点赞成功，当前点赞数:', result.rows[0].likes);
    res.json({
      success: true,
      likes: result.rows[0].likes,
      message: '点赞成功'
    });

  } catch (error) {
    console.error('❌ [API] 点赞失败:', error.message);
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

    const result = await dbClient.query(
      'SELECT DISTINCT category FROM works WHERE category IS NOT NULL ORDER BY category'
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

// ==================== 消息管理 API ====================

// 获取消息列表
app.get('/api/messages', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;

    console.log('📧 [API] 获取消息列表请求:', { page, limit, status, search });

    let whereClause = '';
    let queryParams = [];
    let paramIndex = 1;

    const conditions = [];

    if (status && status !== 'all') {
      conditions.push(`status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex + 1} OR subject ILIKE $${paramIndex + 2} OR message ILIKE $${paramIndex + 3})`);
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
      paramIndex += 4;
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    // 获取总数
    const countQuery = `SELECT COUNT(*) FROM messages ${whereClause}`;
    const countResult = await dbClient.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // 获取消息列表
    const messagesQuery = `
      SELECT id, name, email, subject, message, status, replied, reply_content, 
             ip_address, user_agent, created_at, updated_at
      FROM messages 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const result = await dbClient.query(messagesQuery, queryParams);

    console.log(`✅ [API] 消息列表获取成功，共 ${result.rows.length} 条记录`);
    res.json({
      success: true,
      data: {
        messages: result.rows,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ [API] 获取消息列表失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 根据ID获取消息详情
app.get('/api/messages/:id', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { id } = req.params;
    console.log('📧 [API] 获取消息详情请求:', id);

    const result = await dbClient.query('SELECT * FROM messages WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '消息不存在'
      });
    }

    console.log('✅ [API] 消息详情获取成功');
    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ [API] 获取消息详情失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 创建新消息（联系表单提交）
app.post('/api/messages', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { name, email, subject, message } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('User-Agent');

    console.log('📧 [API] 创建新消息请求:', { name, email, subject });

    const query = `
      INSERT INTO messages (name, email, subject, message, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await dbClient.query(query, [name, email, subject, message, ip_address, user_agent]);

    console.log('✅ [API] 消息创建成功');
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: '消息发送成功'
    });

  } catch (error) {
    console.error('❌ [API] 创建消息失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 更新消息状态
app.put('/api/messages/:id/status', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { id } = req.params;
    const { status } = req.body;

    console.log('📧 [API] 更新消息状态请求:', { id, status });

    // 如果状态是replied，同时设置replied字段为true
    let query, params;
    if (status === 'replied') {
      query = 'UPDATE messages SET status = $1, replied = true, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
      params = [status, id];
    } else {
      query = 'UPDATE messages SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
      params = [status, id];
    }

    const result = await dbClient.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '消息不存在'
      });
    }

    console.log('✅ [API] 消息状态更新成功');
    res.json({
      success: true,
      data: result.rows[0],
      message: '状态更新成功'
    });

  } catch (error) {
    console.error('❌ [API] 更新消息状态失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});



// 删除消息
app.delete('/api/messages/:id', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { id } = req.params;
    console.log('📧 [API] 删除消息请求:', id);

    const result = await dbClient.query('DELETE FROM messages WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '消息不存在'
      });
    }

    console.log('✅ [API] 消息删除成功');
    res.json({
      success: true,
      message: '消息删除成功'
    });

  } catch (error) {
    console.error('❌ [API] 删除消息失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取博客评论
app.get('/api/blogs/:id/comments', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { id } = req.params;
    console.log('💬 [API] 获取博客评论:', id);

    const result = await dbClient.query(
      'SELECT * FROM comments WHERE blog_id = $1 ORDER BY created_at DESC',
      [id]
    );

    console.log('✅ [API] 评论获取成功，数量:', result.rows.length);
    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('❌ [API] 获取评论失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 添加匿名评论
app.post('/api/blogs/:id/comments', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { id } = req.params;
    const { author_name, author_email, content } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.get('User-Agent') || '';

    console.log('💬 [API] 添加评论请求:', { blog_id: id, author_name, ip: clientIP });

    if (!author_name || !content) {
      return res.status(400).json({
        success: false,
        message: '姓名和评论内容不能为空'
      });
    }

    const result = await dbClient.query(
      `INSERT INTO comments (blog_id, author_name, author_email, content, ip_address, user_agent, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP) 
       RETURNING *`,
      [id, author_name, author_email || null, content, clientIP, userAgent]
    );

    console.log('✅ [API] 评论添加成功');
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: '评论添加成功'
    });

  } catch (error) {
    console.error('❌ [API] 添加评论失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 管理员回复评论
app.post('/api/comments/:id/reply', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { id } = req.params;
    const { admin_reply } = req.body;

    console.log('💬 [API] 管理员回复评论请求:', { comment_id: id });

    if (!admin_reply) {
      return res.status(400).json({
        success: false,
        message: '回复内容不能为空'
      });
    }

    const result = await dbClient.query(
      `UPDATE comments SET 
          admin_reply = $1, 
          admin_reply_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 
        RETURNING *`,
      [admin_reply, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    console.log('✅ [API] 评论回复成功');
    res.json({
      success: true,
      data: result.rows[0],
      message: '回复成功'
    });

  } catch (error) {
    console.error('❌ [API] 回复评论失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 删除评论
app.delete('/api/comments/:id', async (req, res) => {
  try {
    if (!dbClient) {
      throw new Error('数据库未连接');
    }

    const { id } = req.params;
    console.log('💬 [API] 删除评论请求:', id);

    const result = await dbClient.query('DELETE FROM comments WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    console.log('✅ [API] 评论删除成功');
    res.json({
      success: true,
      message: '评论删除成功'
    });

  } catch (error) {
    console.error('❌ [API] 删除评论失败:', error.message);
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
  console.log(`   - GET  /api/messages          - 获取消息列表`);
  console.log(`   - GET  /api/messages/:id      - 获取消息详情`);
  console.log(`   - POST /api/messages          - 创建新消息`);
  console.log(`   - PUT  /api/messages/:id/status - 更新消息状态`);
  console.log(`   - PUT  /api/messages/:id/reply  - 回复消息`);
  console.log(`   - DELETE /api/messages/:id    - 删除消息`);
  console.log(`   - GET  /api/blogs/:id/comments - 获取博客评论`);
  console.log(`   - POST /api/blogs/:id/comments - 添加评论`);
  console.log(`   - POST /api/comments/:id/reply - 管理员回复评论`);
  console.log(`   - DELETE /api/comments/:id    - 删除评论`);
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