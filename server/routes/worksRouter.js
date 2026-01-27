import express from 'express';

// 创建作品路由的工厂函数
export function createWorksRouter(getDbClient) {
    const router = express.Router();

    // 获取作品列表
    router.get('/', async (req, res) => {
        try {
            const dbClient = getDbClient();
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
    router.get('/categories', async (req, res) => {
        try {
            const dbClient = getDbClient();
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
    router.get('/:id', async (req, res) => {
        try {
            const dbClient = getDbClient();
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
    router.post('/', async (req, res) => {
        try {
            const dbClient = getDbClient();
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
    router.put('/:id', async (req, res) => {
        try {
            const dbClient = getDbClient();
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
    router.delete('/:id', async (req, res) => {
        try {
            const dbClient = getDbClient();
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
    router.put('/:id/featured', async (req, res) => {
        try {
            const dbClient = getDbClient();
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

    return router;
}
