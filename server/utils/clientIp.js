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

function getProxyHops() {
  const hops = Number.parseInt(process.env.TRUST_PROXY_HOPS || '2', 10);
  if (Number.isNaN(hops) || hops < 1) return 1;
  return hops;
}

export function getClientIp(req) {
  const forwardedForList = parseForwardedForList(readHeader(req, 'x-forwarded-for'));
  const cfConnectingIp = readHeader(req, 'cf-connecting-ip');
  const xRealIp = readHeader(req, 'x-real-ip');
  const proxyHops = getProxyHops();

  if (forwardedForList.length > 0) {
    // 以代理跳数推断真实来源：list 最右是最近代理，向左回溯 proxyHops
    const indexFromLeft = Math.max(0, forwardedForList.length - proxyHops);
    const fromForwardedFor = forwardedForList[indexFromLeft];
    if (fromForwardedFor) return fromForwardedFor;
  }

  // 某些链路不会传 x-forwarded-for，仅传 x-real-ip
  const normalizedXRealIp = normalizeIpForDb(xRealIp);
  if (normalizedXRealIp) return normalizedXRealIp;

  const normalizedCfIp = normalizeIpForDb(cfConnectingIp);
  if (normalizedCfIp) return normalizedCfIp;

  const candidates = [
    req.ip,
    req.socket?.remoteAddress,
    req.connection?.remoteAddress
  ];

  for (const candidate of candidates) {
    const normalized = normalizeIpForDb(candidate);
    if (normalized) return normalized;
  }

  return null;
}
