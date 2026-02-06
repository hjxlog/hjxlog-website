/**
 * API Token验证工具
 */

import crypto from 'crypto';

export function hashApiToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

export function buildApiTokenPrefix(token) {
    if (!token) return '';
    return token.slice(0, Math.min(12, token.length));
}

export function generateApiToken(prefix = 'api_') {
    const safePrefix = prefix.endsWith('_') ? prefix : `${prefix}_`;
    const random = crypto.randomBytes(24).toString('hex');
    return `${safePrefix}${random}`;
}

function hasScope(tokenScopes, requiredScope) {
    if (!requiredScope) return true;
    if (!Array.isArray(tokenScopes)) return false;

    const scopes = new Set(tokenScopes);
    if (scopes.has('*') || scopes.has(requiredScope)) return true;

    const [requiredNamespace] = requiredScope.split(':');
    if (requiredNamespace && scopes.has(`${requiredNamespace}:*`)) return true;

    return false;
}

/**
 * 从数据库验证API Token
 * @param {string} token - 要验证的token
 * @param {object} dbClient - 数据库客户端
 * @returns {Promise<object|null>} - 返回token信息或null
 */
export async function validateApiToken(token, dbClient, options = {}) {
    if (!token || !dbClient) {
        console.warn('[TokenValidator] 缺少 token 或数据库连接');
        return null;
    }

    try {
        // 移除 Bearer 前缀（如果存在）
        const cleanToken = token.replace(/^Bearer\s+/i, '');
        const tokenHash = hashApiToken(cleanToken);

        // 查询数据库
        const result = await dbClient.query(
            `SELECT id, token, token_hash, token_prefix, name, description, source, scopes, is_active, expires_at, created_by
             FROM external_api_tokens
             WHERE is_active = true
               AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
               AND (
                 (token_hash IS NOT NULL AND token_hash = $1) OR
                 token = $2
               )
             LIMIT 1`,
            [tokenHash, cleanToken]
        );

        if (result.rows.length === 0) {
            console.warn('[TokenValidator] 无效或已禁用的 token:', cleanToken.substring(0, 10) + '...');
            return null;
        }

        const tokenInfo = result.rows[0];
        console.log('[TokenValidator] Token 验证成功:', tokenInfo.name, tokenInfo.source);

        // 更新最后使用时间
        await dbClient.query(
            `UPDATE external_api_tokens
             SET last_used_at = CURRENT_TIMESTAMP,
                 last_used_ip = COALESCE($2, last_used_ip)
             WHERE id = $1`,
            [tokenInfo.id, options.ipAddress || null]
        );

        return tokenInfo;

    } catch (error) {
        console.error('[TokenValidator] Token 验证出错:', error.message);
        return null;
    }
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
            console.warn('[TokenValidator] 请求缺少 Authorization header:', req.path);
            return res.status(401).json({
                success: false,
                message: '缺少认证令牌'
            });
        }

        // 验证token
        const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null;
        const tokenInfo = await validateApiToken(authHeader, dbClient, { ipAddress });

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

/**
 * Express中间件：校验Token scope
 * @param {string[]} requiredScopes - 任一命中即可
 * @returns {Function}
 */
export function createTokenScopeMiddleware(requiredScopes = []) {
    return (req, res, next) => {
        const tokenInfo = req.apiToken;
        const tokenScopes = Array.isArray(tokenInfo?.scopes) ? tokenInfo.scopes : [];
        const matched = requiredScopes.length === 0 || requiredScopes.some((scope) => hasScope(tokenScopes, scope));

        if (!matched) {
            return res.status(403).json({
                success: false,
                message: '令牌权限不足'
            });
        }
        next();
    };
}
