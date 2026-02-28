import crypto from 'crypto';
import { buildFallbackVisitorHash } from './ipResolver.js';

const COOKIE_NAME = 'vid';
const COOKIE_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

function parseCookies(req) {
  const cookieHeader = req.headers?.cookie || '';
  if (!cookieHeader) return {};

  return cookieHeader.split(';').reduce((acc, segment) => {
    const idx = segment.indexOf('=');
    if (idx === -1) return acc;
    const key = segment.slice(0, idx).trim();
    const value = segment.slice(idx + 1).trim();
    if (key) acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

function shouldSetVisitorCookie() {
  return String(process.env.VIEW_SET_VISITOR_COOKIE || 'true').toLowerCase() !== 'false';
}

function safeUuid() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return crypto.randomBytes(16).toString('hex');
}

export function resolveVisitorIdentity(req, res, storableIp, userAgent) {
  const cookies = parseCookies(req);
  const existingVisitorId = cookies[COOKIE_NAME] || null;
  const visitorId = existingVisitorId || safeUuid();
  const fallbackHash = buildFallbackVisitorHash(storableIp, userAgent);

  if (!existingVisitorId && shouldSetVisitorCookie() && res?.cookie) {
    res.cookie(COOKIE_NAME, visitorId, {
      maxAge: COOKIE_MAX_AGE_MS,
      httpOnly: true,
      sameSite: 'lax',
      secure: String(process.env.NODE_ENV || '').toLowerCase() === 'production',
      path: '/'
    });
  }

  return {
    visitorId,
    visitorFallbackHash: fallbackHash,
    visitorIdentity: visitorId || fallbackHash
  };
}
