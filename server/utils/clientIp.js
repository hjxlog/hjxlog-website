/**
 * 统一客户端 IP 解析工具
 */

const DEFAULT_TRUSTED_PROXY_CIDRS = [
  '127.0.0.0/8',
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16'
];

function readHeader(req, name) {
  const value = req.headers?.[name];
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

function ipToUint32(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let result = 0;
  for (const part of parts) {
    const n = Number(part);
    if (!Number.isInteger(n) || n < 0 || n > 255) return null;
    result = (result << 8) + n;
  }
  return result >>> 0;
}

function matchIpv4Cidr(ip, cidr) {
  const [base, prefixRaw] = cidr.split('/');
  const prefix = Number(prefixRaw);
  if (!base || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;
  const ipNum = ipToUint32(ip);
  const baseNum = ipToUint32(base);
  if (ipNum === null || baseNum === null) return false;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipNum & mask) === (baseNum & mask);
}

function getTrustedProxyCidrs() {
  const fromEnv = process.env.TRUSTED_PROXY_CIDRS;
  if (!fromEnv || !fromEnv.trim()) return DEFAULT_TRUSTED_PROXY_CIDRS;
  return fromEnv.split(',').map((item) => item.trim()).filter(Boolean);
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

function isTrustedProxy(remoteIp) {
  if (!remoteIp) return false;
  if (remoteIp === '::1') return true;

  const normalized = normalizeIpForDb(remoteIp);
  if (!normalized) return false;

  // 常见 docker/k8s 场景的 IPv6 本地链路
  if (normalized === 'fe80::1' || normalized.startsWith('fd')) {
    return true;
  }

  const cidrs = getTrustedProxyCidrs();
  return cidrs.some((cidr) => matchIpv4Cidr(normalized, cidr));
}

export function getClientIp(req) {
  const remoteIp = normalizeIpForDb(req.socket?.remoteAddress || req.connection?.remoteAddress || req.ip);
  const trustedProxy = isTrustedProxy(remoteIp);

  const forwardedFor = readHeader(req, 'x-forwarded-for');
  const cfConnectingIp = readHeader(req, 'cf-connecting-ip');
  const xRealIp = readHeader(req, 'x-real-ip');

  const candidates = [
    trustedProxy ? forwardedFor : '',
    trustedProxy ? cfConnectingIp : '',
    trustedProxy ? xRealIp : '',
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
