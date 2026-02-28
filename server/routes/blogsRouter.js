import express from 'express';
import { createViewTrackingService } from '../modules/view-tracking/viewTrackingService.js';

// 创建博客路由的工厂函数
export function createBlogsRouter(getDbClient) {
    const router = express.Router();
    const trackingService = createViewTrackingService(getDbClient);

    // 获取博客列表
    router.get('/', async (req, res) => {
        try {
            const dbClient = getDbClient();
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

    // 获取博客分类列表
    router.get('/categories', async (req, res) => {
        try {
            const dbClient = getDbClient();
            if (!dbClient) {
                throw new Error('数据库未连接');
            }

            console.log('🏷️ [API] 获取博客分类请求');

            const result = await dbClient.query(
                'SELECT DISTINCT category FROM blogs WHERE category IS NOT NULL AND published = true AND category != \'\' ORDER BY category'
            );
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
    router.get('/:id', async (req, res) => {
        try {
            const dbClient = getDbClient();
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
    router.post('/:id/view', async (req, res) => {
        try {
            const dbClient = getDbClient();
            if (!dbClient) {
                throw new Error('数据库未连接');
            }

            const { id } = req.params;
            const exists = await dbClient.query('SELECT id FROM blogs WHERE id = $1', [id]);
            if (exists.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '博客不存在'
                });
            }

            const tracking = await trackingService.trackOne({
                type: 'blog',
                id: Number(id),
                path: req.path
            }, req, res);

            const currentViews = await dbClient.query('SELECT views FROM blogs WHERE id = $1', [id]);
            const views = Number(currentViews.rows[0]?.views || 0);

            if (tracking.duplicate) {
                console.log('⚠️ [API] 浏览记录已存在（去重命中）:', { blog_id: id, ip: tracking.ip });
                return res.status(200).json({
                    success: true,
                    data: { views },
                    message: '浏览记录已存在'
                });
            }

            console.log('✅ [API] 阅读次数增加成功，当前浏览数:', views);
            res.json({
                success: true,
                data: { views }
            });

        } catch (error) {
            console.error('❌ [API] 增加阅读次数失败:', error.message);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // 创建新博客
    router.post('/', async (req, res) => {
        try {
            const dbClient = getDbClient();
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
    router.put('/:id', async (req, res) => {
        try {
            const dbClient = getDbClient();
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
    router.delete('/:id', async (req, res) => {
        try {
            const dbClient = getDbClient();
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

    return router;
}
