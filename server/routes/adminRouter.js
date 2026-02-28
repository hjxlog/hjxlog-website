import express from 'express';
import {
    buildApiTokenPrefix,
    generateApiToken,
    hashApiToken
} from '../utils/tokenValidator.js';

const VIEW_LOG_OPTIONAL_COLUMNS = [
    'visitor_id',
    'visitor_fallback_hash',
    'ip_quality',
    'is_bot',
    'dedupe_key',
    'accepted'
];

async function getViewLogsColumnSet(dbClient) {
    const result = await dbClient.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'view_logs'`
    );
    return new Set(result.rows.map((row) => row.column_name));
}

function parsePositiveInt(value, fallbackValue) {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    if (Number.isNaN(parsed) || parsed <= 0) return fallbackValue;
    return parsed;
}

function buildViewLogsWhereClause(query, queryParams, columnSet, options = {}) {
    const whereConditions = [];
    let paramIndex = queryParams.length + 1;

    const append = (condition, value) => {
        whereConditions.push(condition.replace('?', `$${paramIndex++}`));
        queryParams.push(value);
    };

    const startDate = query.start_date ? String(query.start_date) : '';
    const endDate = query.end_date ? String(query.end_date) : '';

    if (startDate) {
        append('created_at >= ?', startDate);
    } else {
        whereConditions.push(`created_at >= CURRENT_DATE - INTERVAL '6 days'`);
    }

    if (endDate) {
        append('created_at < (?::date + INTERVAL \'1 day\')', endDate);
    }

    if (query.target_type) {
        append('target_type = ?', String(query.target_type));
    }

    if (query.target_id !== undefined && query.target_id !== '') {
        const targetId = Number.parseInt(String(query.target_id), 10);
        if (!Number.isNaN(targetId)) {
            append('target_id = ?', targetId);
        }
    }

    if (query.path) {
        append('path ILIKE ?', `%${String(query.path)}%`);
    }

    if (query.ip_location) {
        append('ip_location ILIKE ?', `%${String(query.ip_location)}%`);
    }

    if (query.search) {
        const pattern = `%${String(query.search)}%`;
        const patternParams = [
            `path ILIKE $${paramIndex++}`,
            `ip_location ILIKE $${paramIndex++}`,
            `user_agent ILIKE $${paramIndex++}`,
            `ip_address::text ILIKE $${paramIndex++}`,
            `target_type ILIKE $${paramIndex++}`
        ];
        whereConditions.push(`(${patternParams.join(' OR ')})`);
        queryParams.push(pattern, pattern, pattern, pattern, pattern);
    }

    if (columnSet.has('ip_quality') && query.ip_quality) {
        append('ip_quality = ?', String(query.ip_quality));
    }

    if (columnSet.has('is_bot') && query.is_bot !== undefined && query.is_bot !== '') {
        append('is_bot = ?', String(query.is_bot).toLowerCase() === 'true');
    }

    if (columnSet.has('accepted') && query.accepted !== undefined && query.accepted !== '') {
        append('accepted = ?', String(query.accepted).toLowerCase() === 'true');
    }

    if (options.excludeBotsInInsights && columnSet.has('is_bot')) {
        whereConditions.push('is_bot = false');
    }

    if (options.onlyAcceptedInInsights && columnSet.has('accepted')) {
        whereConditions.push('accepted = true');
    }

    if (whereConditions.length === 0) {
        return '';
    }
    return ` WHERE ${whereConditions.join(' AND ')}`;
}

function buildViewLogsSelectColumns(columnSet) {
    const optionalSelect = VIEW_LOG_OPTIONAL_COLUMNS.map((column) => {
        if (columnSet.has(column)) {
            if (column === 'visitor_id') return `${column}::text AS ${column}`;
            return column;
        }
        if (column === 'is_bot' || column === 'accepted') return `NULL::boolean AS ${column}`;
        return `NULL::text AS ${column}`;
    });

    return [
        'id',
        'target_type',
        'target_id',
        'ip_address::text AS ip_address',
        'ip_location',
        'user_agent',
        'path',
        'created_at',
        ...optionalSelect
    ].join(', ');
}

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

    // 获取轻量访问统计（Dashboard 首页）
    router.get('/view-stats/simple', async (req, res) => {
        try {
            const dbClient = getDbClient();
            if (!dbClient) {
                throw new Error('数据库未连接');
            }

            const result = await dbClient.query(
                `SELECT
                    COUNT(*)::int AS total_views,
                    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int AS today_views,
                    COUNT(*) FILTER (
                        WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
                          AND created_at < CURRENT_DATE
                    )::int AS yesterday_views,
                    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '6 days')::int AS last7_days_views
                 FROM view_logs`
            );

            const row = result.rows[0] || {};

            const locationResult = await dbClient.query(
                `SELECT ip_location AS location, COUNT(*)::int AS count
                 FROM view_logs
                 WHERE ip_location IS NOT NULL
                   AND BTRIM(ip_location) <> ''
                 GROUP BY ip_location
                 ORDER BY count DESC, ip_location ASC
                 LIMIT 6`
            );

            const locationTodayResult = await dbClient.query(
                `SELECT ip_location AS location, COUNT(*)::int AS count
                 FROM view_logs
                 WHERE ip_location IS NOT NULL
                   AND BTRIM(ip_location) <> ''
                   AND created_at >= CURRENT_DATE
                 GROUP BY ip_location
                 ORDER BY count DESC, ip_location ASC`
            );

            const locationYesterdayResult = await dbClient.query(
                `SELECT ip_location AS location, COUNT(*)::int AS count
                 FROM view_logs
                 WHERE ip_location IS NOT NULL
                   AND BTRIM(ip_location) <> ''
                   AND created_at >= CURRENT_DATE - INTERVAL '1 day'
                   AND created_at < CURRENT_DATE
                 GROUP BY ip_location
                 ORDER BY count DESC, ip_location ASC`
            );

            res.json({
                success: true,
                data: {
                    todayViews: Number(row.today_views || 0),
                    yesterdayViews: Number(row.yesterday_views || 0),
                    last7DaysViews: Number(row.last7_days_views || 0),
                    totalViews: Number(row.total_views || 0),
                    topLocations: locationResult.rows.map((item) => ({
                        location: item.location,
                        count: Number(item.count || 0)
                    })),
                    topLocationsToday: locationTodayResult.rows.map((item) => ({
                        location: item.location,
                        count: Number(item.count || 0)
                    })),
                    topLocationsYesterday: locationYesterdayResult.rows.map((item) => ({
                        location: item.location,
                        count: Number(item.count || 0)
                    }))
                }
            });
        } catch (error) {
            console.error('❌ [API] 获取轻量访问统计失败:', error.message);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // 获取浏览记录洞察
    router.get('/view-logs/insights', async (req, res) => {
        try {
            const dbClient = getDbClient();
            if (!dbClient) throw new Error('数据库未连接');

            const columnSet = await getViewLogsColumnSet(dbClient);
            const queryParams = [];
            const includeBots = String(req.query.include_bots || '').toLowerCase() === 'true';
            const whereClause = buildViewLogsWhereClause(req.query, queryParams, columnSet, {
                excludeBotsInInsights: !includeBots,
                onlyAcceptedInInsights: true
            });

            const summaryResult = await dbClient.query(
                `SELECT
                    COUNT(*)::int AS total_views,
                    COUNT(DISTINCT ip_address)::int AS unique_ips,
                    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int AS today_views,
                    COUNT(*) FILTER (
                      WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
                        AND created_at < CURRENT_DATE
                    )::int AS yesterday_views
                 FROM view_logs
                 ${whereClause}`,
                queryParams
            );

            const summaryRow = summaryResult.rows[0] || {};
            const totalViews = Number(summaryRow.total_views || 0);
            const safeTotalViews = totalViews > 0 ? totalViews : 1;

            const regionResult = await dbClient.query(
                `SELECT
                    COALESCE(NULLIF(BTRIM(ip_location), ''), '未知位置') AS location,
                    COUNT(*)::int AS count
                 FROM view_logs
                 ${whereClause}
                 GROUP BY COALESCE(NULLIF(BTRIM(ip_location), ''), '未知位置')
                 ORDER BY count DESC, location ASC`,
                queryParams
            );

            const contentResult = await dbClient.query(
                `SELECT
                    target_type,
                    target_id,
                    COUNT(*)::int AS count
                 FROM view_logs
                 ${whereClause}
                 GROUP BY target_type, target_id
                 ORDER BY count DESC, target_type ASC, target_id ASC
                 LIMIT 20`,
                queryParams
            );

            const pathResult = await dbClient.query(
                `SELECT
                    COALESCE(NULLIF(BTRIM(path), ''), '(unknown)') AS path,
                    COUNT(*)::int AS count
                 FROM view_logs
                 ${whereClause}
                 GROUP BY COALESCE(NULLIF(BTRIM(path), ''), '(unknown)')
                 ORDER BY count DESC, path ASC
                 LIMIT 20`,
                queryParams
            );

            res.json({
                success: true,
                data: {
                    summary: {
                        totalViews,
                        uniqueIps: Number(summaryRow.unique_ips || 0),
                        todayViews: Number(summaryRow.today_views || 0),
                        yesterdayViews: Number(summaryRow.yesterday_views || 0)
                    },
                    regions: regionResult.rows.map((item) => ({
                        location: item.location,
                        count: Number(item.count || 0),
                        ratio: Number(((Number(item.count || 0) / safeTotalViews) * 100).toFixed(1))
                    })),
                    contentHotspots: contentResult.rows.map((item) => ({
                        targetType: item.target_type,
                        targetId: Number(item.target_id || 0),
                        count: Number(item.count || 0),
                        ratio: Number(((Number(item.count || 0) / safeTotalViews) * 100).toFixed(1))
                    })),
                    pathHotspots: pathResult.rows.map((item) => ({
                        path: item.path,
                        count: Number(item.count || 0),
                        ratio: Number(((Number(item.count || 0) / safeTotalViews) * 100).toFixed(1))
                    }))
                }
            });
        } catch (error) {
            console.error('❌ [API] 获取浏览记录洞察失败:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 获取浏览记录列表
    router.get('/view-logs', async (req, res) => {
        try {
            const dbClient = getDbClient();
            if (!dbClient) throw new Error('数据库未连接');

            const columnSet = await getViewLogsColumnSet(dbClient);
            const page = parsePositiveInt(req.query.page, 1);
            const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
            const offset = (page - 1) * limit;

            const params = [];
            const whereClause = buildViewLogsWhereClause(req.query, params, columnSet);
            const selectColumns = buildViewLogsSelectColumns(columnSet);

            const query = `SELECT ${selectColumns}
                           FROM view_logs
                           ${whereClause}
                           ORDER BY created_at DESC
                           LIMIT $${params.length + 1}
                           OFFSET $${params.length + 2}`;

            const countQuery = `SELECT COUNT(*)::int AS total
                                FROM view_logs
                                ${whereClause}`;

            const logs = await dbClient.query(query, [...params, limit, offset]);
            const totalResult = await dbClient.query(countQuery, params);
            const total = Number(totalResult.rows[0]?.total || 0);

            res.json({
                success: true,
                data: {
                    list: logs.rows,
                    total,
                    page,
                    limit,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.max(1, Math.ceil(total / limit))
                    }
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

    // 获取外部API Token列表（简化模型：描述 + key + 启用状态）
    router.get('/external-tokens', async (req, res) => {
        try {
            const dbClient = getDbClient();
            if (!dbClient) throw new Error('数据库未连接');

            const result = await dbClient.query(
                `SELECT id, description, token, token_prefix, is_active, last_used_at, last_used_ip, created_at, updated_at
                 FROM external_api_tokens
                 ORDER BY created_at DESC`
            );

            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 创建外部API Token（简化模型：描述 + key）
    router.post('/external-tokens', async (req, res) => {
        try {
            const dbClient = getDbClient();
            if (!dbClient) throw new Error('数据库未连接');

            const {
                description = '',
                key,
                created_by = 'admin'
            } = req.body || {};

            if (!description || typeof description !== 'string') {
                return res.status(400).json({ success: false, message: 'description 不能为空' });
            }

            const plainToken = typeof key === 'string' && key.trim()
                ? key.trim()
                : generateApiToken('oc_');
            const tokenHash = hashApiToken(plainToken);
            const maskedPrefix = buildApiTokenPrefix(plainToken);

            const result = await dbClient.query(
                `INSERT INTO external_api_tokens
                    (token, token_hash, token_prefix, name, description, source, scopes, is_active, created_by)
                 VALUES ($1, $2, $3, $4, $5, 'openclaw', '[]'::jsonb, true, $6)
                 RETURNING id, description, token, token_prefix, is_active, created_at`,
                [plainToken, tokenHash, maskedPrefix, description.trim(), description.trim(), created_by]
            );

            res.status(201).json({
                success: true,
                data: result.rows[0]
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 更新 token（仅描述和启用状态）
    router.patch('/external-tokens/:id', async (req, res) => {
        try {
            const dbClient = getDbClient();
            if (!dbClient) throw new Error('数据库未连接');

            const { id } = req.params;
            const { description, is_active } = req.body || {};

            const updates = [];
            const values = [];
            let idx = 1;

            if (typeof description === 'string') {
                updates.push(`description = $${idx++}`);
                updates.push(`name = $${idx++}`);
                values.push(description.trim(), description.trim());
            }
            if (typeof is_active === 'boolean') {
                updates.push(`is_active = $${idx++}`);
                values.push(is_active);
                if (!is_active) {
                    updates.push('revoked_at = CURRENT_TIMESTAMP');
                } else {
                    updates.push('revoked_at = NULL');
                }
            }

            if (updates.length === 0) {
                return res.status(400).json({ success: false, message: '没有可更新字段' });
            }

            values.push(id);
            const result = await dbClient.query(
                `UPDATE external_api_tokens
                 SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $${idx}
                 RETURNING id, description, token, token_prefix, is_active, last_used_at, last_used_ip, created_at, updated_at, revoked_at`,
                values
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Token 不存在' });
            }
            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    return router;
}
