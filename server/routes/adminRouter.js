import express from 'express';

// 创建管理后台路由的工厂函数
export function createAdminRouter(getDbClient, getLogger) {
    const router = express.Router();

    // 获取管理后台统计数据
    router.get('/stats', async (req, res) => {
        try {
            const dbClient = getDbClient();
            if (!dbClient) {
                throw new Error('数据库未连接');
            }

            console.log('📊 [API] 获取后台统计数据请求');

            // 获取总浏览量 (view_logs 总数)
            const viewsResult = await dbClient.query('SELECT COUNT(*) as total FROM view_logs');
            const totalViews = parseInt(viewsResult.rows[0].total || 0);

            console.log('✅ [API] 统计数据获取成功:', { totalViews });

            res.json({
                success: true,
                data: {
                    totalViews
                }
            });

        } catch (error) {
            console.error('❌ [API] 获取统计数据失败:', error.message);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // 获取浏览记录列表
    router.get('/view-logs', async (req, res) => {
        try {
            const dbClient = getDbClient();
            if (!dbClient) throw new Error('数据库未连接');

            const { page = 1, limit = 20, type } = req.query;
            const offset = (page - 1) * limit;

            let query = 'SELECT * FROM view_logs';
            let countQuery = 'SELECT COUNT(*) FROM view_logs';
            const params = [];

            if (type) {
                query += ' WHERE target_type = $1';
                countQuery += ' WHERE target_type = $1';
                params.push(type);
            }

            query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);

            const logs = await dbClient.query(query, [...params, limit, offset]);
            const totalResult = await dbClient.query(countQuery, params);

            res.json({
                success: true,
                data: {
                    list: logs.rows,
                    total: parseInt(totalResult.rows[0].count),
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            console.error('❌ [API] 获取浏览记录失败:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 获取系统日志列表
    router.get('/logs', async (req, res) => {
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

            // 获取总数 (简化版本)
            let countQuery = 'SELECT COUNT(*) as total FROM system_logs';
            if (whereConditions.length > 0) {
                countQuery += ' WHERE ' + whereConditions.join(' AND ');
            }

            const countResult = await dbClient.query(countQuery, queryParams.slice(0, queryParams.length - 2));
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

    // 获取系统日志详情
    router.get('/logs/:id', async (req, res) => {
        try {
            const dbClient = getDbClient();
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
    router.delete('/logs/cleanup', async (req, res) => {
        try {
            const dbClient = getDbClient();
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

    // 数据导出 API
    router.get('/export/:type', async (req, res) => {
        const { type } = req.params;
        const validTypes = ['works', 'blogs', 'photos', 'moments', 'all'];

        if (!validTypes.includes(type)) {
            return res.status(400).json({ success: false, message: '无效的导出类型' });
        }

        try {
            const dbClient = getDbClient();
            if (!dbClient) {
                throw new Error('数据库未连接');
            }

            if (type === 'all') {
                console.log(`📦 [API] 导出所有数据请求`);
                let sql = `-- Full Database Export\n`;
                sql += `-- Generated at: ${new Date().toISOString()}\n\n`;

                for (const t of validTypes) {
                    if (t === 'all') continue;

                    sql += `-- Export of table: ${t}\n`;
                    const result = await dbClient.query(`SELECT * FROM ${t}`);
                    const rows = result.rows;
                    sql += `-- Record count: ${rows.length}\n\n`;

                    if (rows.length > 0) {
                        const columns = Object.keys(rows[0]);
                        for (const row of rows) {
                            const values = columns.map(col => {
                                const val = row[col];
                                if (val === null || val === undefined) return 'NULL';
                                if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
                                if (typeof val === 'number') return val;
                                if (val instanceof Date) return `'${val.toISOString()}'`;
                                if (Array.isArray(val)) {
                                    if (val.length === 0) return "'{}'";
                                    const content = val.map(v => `'${String(v).replace(/'/g, "''")}'`).join(',');
                                    return `ARRAY[${content}]`;
                                }
                                if (typeof val === 'object') {
                                    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                                }
                                return `'${String(val).replace(/'/g, "''")}'`;
                            });
                            sql += `INSERT INTO ${t} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
                        }
                    }
                    sql += `\n`;
                }

                res.setHeader('Content-Type', 'application/sql');
                res.setHeader('Content-Disposition', `attachment; filename=full_backup_${new Date().toISOString().slice(0, 10)}.sql`);
                return res.send(sql);
            }

            console.log(`📦 [API] 导出数据请求: ${type}`);
            const result = await dbClient.query(`SELECT * FROM ${type}`);
            const rows = result.rows;

            let sql = `-- Export of table: ${type}\n`;
            sql += `-- Generated at: ${new Date().toISOString()}\n`;
            sql += `-- Record count: ${rows.length}\n\n`;

            if (rows.length > 0) {
                const columns = Object.keys(rows[0]);

                for (const row of rows) {
                    const values = columns.map(col => {
                        const val = row[col];

                        if (val === null || val === undefined) return 'NULL';
                        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
                        if (typeof val === 'number') return val;
                        if (val instanceof Date) return `'${val.toISOString()}'`;

                        if (Array.isArray(val)) {
                            if (val.length === 0) return "'{}'";
                            const content = val.map(v => `'${String(v).replace(/'/g, "''")}'`).join(',');
                            return `ARRAY[${content}]`;
                        }

                        if (typeof val === 'object') {
                            return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                        }

                        return `'${String(val).replace(/'/g, "''")}'`;
                    });

                    sql += `INSERT INTO ${type} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
                }
            } else {
                sql += `-- No records found in table ${type}\n`;
            }

            res.setHeader('Content-Type', 'application/sql');
            res.setHeader('Content-Disposition', `attachment; filename=${type}_backup_${new Date().toISOString().slice(0, 10)}.sql`);
            res.send(sql);

        } catch (error) {
            console.error(`❌ [API] 导出 ${type} 失败:`, error.message);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    return router;
}
