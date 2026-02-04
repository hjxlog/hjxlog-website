/**
 * API Token验证工具
 */

import { createLogger } from './logMiddleware.js';

const logger = createLogger('TokenValidator');

/**
 * 从数据库验证API Token
 * @param {string} token - 要验证的token
 * @param {object} dbClient - 数据库客户端
 * @returns {Promise<object|null>} - 返回token信息或null
 */
export async function validateApiToken(token, dbClient) {
    if (!token || !dbClient) {
        logger.warn('Token验证失败：缺少token或数据库连接');
        return null;
    }

    try {
        // 移除 Bearer 前缀（如果存在）
        const cleanToken = token.replace(/^Bearer\s+/i, '');

        // 查询数据库
        const result = await dbClient.query(
            `SELECT id, token, name, description, source, is_active, created_by
             FROM external_api_tokens
             WHERE token = $1 AND is_active = true
             LIMIT 1`,
            [cleanToken]
        );

        if (result.rows.length === 0) {
            logger.warn('Token验证失败：无效或已禁用的token', { tokenPrefix: cleanToken.substring(0, 10) + '...' });
            return null;
        }

        const tokenInfo = result.rows[0];
        logger.info('Token验证成功', { 
            tokenName: tokenInfo.name, 
            source: tokenInfo.source 
        });

        // 更新最后使用时间
        await dbClient.query(
            `UPDATE external_api_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [tokenInfo.id]
        );

        return tokenInfo;

    } catch (error) {
        logger.error('Token验证过程出错', { error: error.message });
        return null;
    }
}

/**
 * 生成新的API Token
 * @param {string} prefix - token前缀（如 'oc_' 表示OpenClaw）
 * @returns {string} - 生成的token
 */
export function generateApiToken(prefix = 'api_') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const hash = Buffer.from(`${prefix}${timestamp}${random}`).toString('base64');
    return prefix + hash.replace(/[^a-zA-Z0-9]/g, '').substring(0, 40);
}

/**
 * Express中间件：验证API Token
 * @param {object} dbClient - 数据库客户端
 * @returns {Function} - Express中间件函数
 */
export function createTokenAuthMiddleware(dbClient) {
    return async (req, res, next) => {
        // 从Authorization header获取token
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            logger.warn('请求缺少Authorization header', { path: req.path });
            return res.status(401).json({
                success: false,
                message: '缺少认证令牌'
            });
        }

        // 验证token
        const tokenInfo = await validateApiToken(authHeader, dbClient);

        if (!tokenInfo) {
            return res.status(403).json({
                success: false,
                message: '无效或已禁用的令牌'
            });
        }

        // 将token信息附加到请求对象
        req.apiToken = tokenInfo;
        next();
    };
}
