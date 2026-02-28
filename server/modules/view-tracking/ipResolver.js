import crypto from 'crypto';

const DEFAULT_PLACEHOLDER_IP = '0.0.0.0';

function readHeader(req, name) {
  const value = req.headers?.[name];
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

export function normalizeIp(rawIp) {
  if (!rawIp) return null;

  let ip = String(rawIp).trim();
  if (!ip) return null;

  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  ip = ip.replace(/^for=/i, '').replace(/^"|"$/g, '');

  if (ip.startsWith('[') && ip.includes(']')) {
    ip = ip.slice(1, ip.indexOf(']'));
  }

  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(ip)) {
    ip = ip.replace(/:\d+$/, '');
  }

  if (ip.startsWith('::ffff:')) {
    ip = ip.slice(7);
  }

  return ip || null;
}

function isIpv4(ip) {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip);
}

function isIpv6(ip) {
  return typeof ip === 'string' && ip.includes(':');
}

function isPrivateIpv4(ip) {
  const parts = ip.split('.').map((n) => Number(n));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  if (parts[0] === 10) return true;
  if (parts[0] === 127) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 169 && parts[1] === 254) return true;
  return false;
}

function isPrivateIpv6(ip) {
  const lower = ip.toLowerCase();
  if (lower === '::1') return true;
  if (lower.startsWith('fe80:')) return true;
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
  return false;
}

export function isPublicIp(ip) {
  if (!ip) return false;
  if (isIpv4(ip)) return !isPrivateIpv4(ip);
  if (isIpv6(ip)) return !isPrivateIpv6(ip);
  return false;
}

function parseXForwardedFor(req) {
  const raw = readHeader(req, 'x-forwarded-for');
  if (!raw) return [];
  return String(raw)
    .split(',')
    .map((item) => normalizeIp(item))
    .filter(Boolean);
}

function firstPublicIp(ips) {
  for (const ip of ips) {
    if (isPublicIp(ip)) return ip;
  }
  return null;
}

export function resolveClientIp(req) {
  const forwardedIps = parseXForwardedFor(req);
  const cfConnectingIp = normalizeIp(readHeader(req, 'cf-connecting-ip'));
  const xRealIp = normalizeIp(readHeader(req, 'x-real-ip'));
  const reqIp = normalizeIp(req.ip);
  const socketIp = normalizeIp(req.socket?.remoteAddress);
  const connectionIp = normalizeIp(req.connection?.remoteAddress);

  const publicIp =
    (cfConnectingIp && isPublicIp(cfConnectingIp) ? cfConnectingIp : null) ||
    firstPublicIp(forwardedIps) ||
    (xRealIp && isPublicIp(xRealIp) ? xRealIp : null) ||
    (reqIp && isPublicIp(reqIp) ? reqIp : null) ||
    (socketIp && isPublicIp(socketIp) ? socketIp : null) ||
    (connectionIp && isPublicIp(connectionIp) ? connectionIp : null) ||
    null;

  const placeholderIp = normalizeIp(process.env.CLIENT_IP_PLACEHOLDER) || DEFAULT_PLACEHOLDER_IP;
  const storableIp = publicIp || placeholderIp;

  return {
    publicIp,
    storableIp,
    ipQuality: publicIp ? 'public' : 'placeholder',
    debug: {
      forwardedIps,
      cfConnectingIp,
      xRealIp,
      reqIp,
      socketIp,
      connectionIp
    }
  };
}

export function buildFallbackVisitorHash(ip, userAgent) {
  return crypto
    .createHash('sha256')
    .update(`${ip || DEFAULT_PLACEHOLDER_IP}|${userAgent || ''}`)
    .digest('hex');
}
