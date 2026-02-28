/**
 * 统一客户端 IP 解析工具
 */

function readHeader(req, name) {
  const value = req.headers?.[name];
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

export function normalizeIpForDb(rawIp) {
  if (!rawIp) return null;

  let ip = String(rawIp).trim();
  if (!ip) return null;

  // 兼容 x-forwarded-for 链，取第一个
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  // 兼容 Forwarded: for=1.2.3.4 风格
  ip = ip.replace(/^for=/i, '').replace(/^"|"$/g, '');

  // 兼容 [IPv6]:port
  if (ip.startsWith('[') && ip.includes(']')) {
    ip = ip.slice(1, ip.indexOf(']'));
  }

  // 兼容 IPv4:port
  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(ip)) {
    ip = ip.replace(/:\d+$/, '');
  }

  // 兼容 IPv4-mapped IPv6
  if (ip.startsWith('::ffff:')) {
    ip = ip.slice(7);
  }

  return ip || null;
}

function parseForwardedForList(raw) {
  if (!raw) return [];
  return String(raw)
    .split(',')
    .map((item) => normalizeIpForDb(item))
    .filter(Boolean);
}

function isIpv4(ip) {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip);
}

function isIpv6(ip) {
  return ip.includes(':');
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
  if (lower.startsWith('fe80:')) return true; // link-local
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local
  return false;
}

function isPublicIp(ip) {
  if (!ip) return false;
  if (isIpv4(ip)) return !isPrivateIpv4(ip);
  if (isIpv6(ip)) return !isPrivateIpv6(ip);
  return false;
}

function pickFirstPublic(ips) {
  for (const ip of ips) {
    if (isPublicIp(ip)) return ip;
  }
  return null;
}

export function isPublicClientIp(ip) {
  return isPublicIp(normalizeIpForDb(ip));
}

export function getClientIpDebug(req) {
  const forwardedForList = parseForwardedForList(readHeader(req, 'x-forwarded-for'));
  const cfConnectingIp = normalizeIpForDb(readHeader(req, 'cf-connecting-ip'));
  const xRealIp = normalizeIpForDb(readHeader(req, 'x-real-ip'));
  const reqIp = normalizeIpForDb(req.ip);
  const socketIp = normalizeIpForDb(req.socket?.remoteAddress);
  const connectionIp = normalizeIpForDb(req.connection?.remoteAddress);

  const publicFromForwarded = pickFirstPublic(forwardedForList);
  const anyFromForwarded = forwardedForList[0] || null;
  const selected =
    (cfConnectingIp && isPublicIp(cfConnectingIp) ? cfConnectingIp : null) ||
    publicFromForwarded ||
    (xRealIp && isPublicIp(xRealIp) ? xRealIp : null) ||
    cfConnectingIp ||
    anyFromForwarded ||
    xRealIp ||
    reqIp ||
    socketIp ||
    connectionIp ||
    null;

  return {
    selected,
    forwardedForList,
    cfConnectingIp,
    xRealIp,
    reqIp,
    socketIp,
    connectionIp
  };
}

export function getClientIp(req) {
  return getClientIpDebug(req).selected;
}

export function getPublicClientIp(req) {
  const debug = getClientIpDebug(req);

  const candidates = [
    debug.cfConnectingIp,
    ...debug.forwardedForList,
    debug.xRealIp,
    debug.reqIp,
    debug.socketIp,
    debug.connectionIp
  ];

  const publicIp = pickFirstPublic(candidates);
  return publicIp || null;
}

function getPlaceholderIp() {
  const fromEnv = normalizeIpForDb(process.env.CLIENT_IP_PLACEHOLDER || '');
  if (fromEnv) return fromEnv;
  return '0.0.0.0';
}

export function getStorableClientIp(req) {
  return getPublicClientIp(req) || getPlaceholderIp();
}
