import express from 'express';

// 创建动态路由的工厂函数
export function createMomentsRouter(getDbClient) {
    const router = express.Router();

    // 获取动态列表
    router.get('/', async (req, res) => {
        try {
            const dbClient = getDbClient();
            if (!dbClient) {
                throw new Error('数据库未连接');
            }

            const { page = 1, limit = 10, sort = 'created_at', include_private = 'false' } = req.query;
            console.log('📱 [API] 获取动态列表请求:', { page, limit, sort, include_private });

            const offset = (parseInt(page) - 1) * parseInt(limit);

            // 根据include_private参数决定查询条件
            const includePrivate = include_private === 'true' && Boolean(req.authUser);
            const whereClause = includePrivate ? '' : "WHERE visibility = 'public'";
            const countWhereClause = includePrivate ? '' : "WHERE visibility = 'public'";

            // 获取动态列表（包含图片和浏览量，浏览量从 view_logs 表统计）
            const result = await dbClient.query(
                `SELECT 
          m.id,
          m.content,
          m.author_id,
          m.visibility,
          m.created_at,
          m.updated_at,
          (SELECT COUNT(*) FROM view_logs vl WHERE vl.target_type = 'moment' AND vl.target_id = m.id) as views
        FROM moments m
        ${whereClause}
        ORDER BY m.${sort} DESC
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
    router.get('/:id', async (req, res) => {
        try {
            const dbClient = getDbClient();
            if (!dbClient) {
                throw new Error('数据库未连接');
            }

            const { id } = req.params;
            console.log('📱 [API] 获取动态详情请求:', id);

            // 获取动态详情（包含图片和浏览量，浏览量从 view_logs 表统计）
            const result = await dbClient.query(
                `SELECT 
          m.id,
          m.content,
          m.author_id,
          m.visibility,
          m.created_at,
          m.updated_at,
          (SELECT COUNT(*) FROM view_logs vl WHERE vl.target_type = 'moment' AND vl.target_id = m.id) as views
        FROM moments m
        WHERE m.id = $1`,
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '动态不存在'
                });
            }

            const moment = result.rows[0];
            if (moment.visibility !== 'public' && !req.authUser) {
                return res.status(404).json({
                    success: false,
                    message: '动态不存在'
                });
            }

            console.log('✅ [API] 动态详情获取成功');
            res.json({
                success: true,
                data: moment
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
    router.post('/', async (req, res) => {
        try {
            const dbClient = getDbClient();
            if (!dbClient) {
                throw new Error('数据库未连接');
            }

            const { content, visibility = 'public' } = req.body;
            console.log('📱 [API] 创建动态请求:', { content: content?.substring(0, 50) + '...' });

            if (!content) {
                return res.status(400).json({
                    success: false,
                    message: '动态内容不能为空'
                });
            }

            // 创建动态
            const momentResult = await dbClient.query(
                'INSERT INTO moments (content, visibility) VALUES ($1, $2) RETURNING *',
                [content, visibility]
            );

            console.log('✅ [API] 动态创建成功，ID:', momentResult.rows[0].id);
            res.status(201).json({
                success: true,
                data: momentResult.rows[0],
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
    router.put('/:id', async (req, res) => {
        try {
            const dbClient = getDbClient();
            if (!dbClient) {
                throw new Error('数据库未连接');
            }

            const { id } = req.params;
            const { content, visibility } = req.body;
            console.log('📱 [API] 更新动态请求:', { id, content: content?.substring(0, 50) + '...' });

            if (!content) {
                return res.status(400).json({
                    success: false,
                    message: '动态内容不能为空'
                });
            }

            // 更新动态
            const updateFields = ['content = $1'];
            const updateValues = [content];
            let paramIndex = 2;

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
                data: result.rows[0],
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
    router.delete('/:id', async (req, res) => {
        try {
            const dbClient = getDbClient();
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

    return router;
}
