import express from 'express';

// 创建照片路由的工厂函数
export function createPhotosRouter(getDbClient) {
    const router = express.Router();

    // 获取照片列表（支持分页、分类筛选、搜索）
    router.get('/', async (req, res) => {
        try {
            const dbClient = getDbClient();
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

            // 筛选发布状态
            if (published === 'true') {
                whereConditions.push(`published = $${paramIndex++}`);
                queryParams.push(true);
            } else if (published === 'false') {
                whereConditions.push(`published = $${paramIndex++}`);
                queryParams.push(false);
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

    // 获取照片分类列表
    router.get('/categories', async (req, res) => {
        try {
            const dbClient = getDbClient();
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
    router.get('/:id', async (req, res) => {
        try {
            const dbClient = getDbClient();
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
    router.post('/', async (req, res) => {
        try {
            const dbClient = getDbClient();
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
    router.put('/:id', async (req, res) => {
        try {
            const dbClient = getDbClient();
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
    router.delete('/:id', async (req, res) => {
        try {
            const dbClient = getDbClient();
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
    router.delete('/', async (req, res) => {
        try {
            const dbClient = getDbClient();
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

    return router;
}
