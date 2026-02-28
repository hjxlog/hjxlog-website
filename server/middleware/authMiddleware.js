import { verifyAuthToken } from '../utils/authToken.js';

function extractBearerToken(req) {
  const authHeader = req.headers?.authorization || '';
  if (!authHeader) return null;
  const matched = String(authHeader).match(/^Bearer\s+(.+)$/i);
  return matched?.[1] || null;
}

async function loadUserFromToken(req, getDbClient) {
  const token = extractBearerToken(req);
  if (!token) return null;

  const payload = verifyAuthToken(token);
  if (!payload?.userId) return null;

  const dbClient = getDbClient();
  if (!dbClient) return null;

  try {
    const result = await dbClient.query(
      'SELECT id, username, email, avatar, bio FROM users WHERE id = $1 LIMIT 1',
      [payload.userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    return null;
  }
}

export function createOptionalAuthMiddleware(getDbClient) {
  return async (req, res, next) => {
    const user = await loadUserFromToken(req, getDbClient);
    req.authUser = user;
    next();
  };
}

export function createRequireAuthMiddleware(getDbClient) {
  return async (req, res, next) => {
    const user = await loadUserFromToken(req, getDbClient);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '未授权访问'
      });
    }
    req.authUser = user;
    next();
  };
}

