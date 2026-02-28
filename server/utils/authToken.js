import crypto from 'crypto';

const DEFAULT_EXPIRES_HOURS = 24 * 7;

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(input) {
  const normalized = String(input || '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function getSecret() {
  return process.env.AUTH_TOKEN_SECRET || process.env.DB_PASSWORD || 'change-this-secret';
}

function sign(value) {
  return base64UrlEncode(
    crypto.createHmac('sha256', getSecret()).update(value).digest()
  );
}

function parseExpiryHours() {
  const raw = Number.parseInt(process.env.AUTH_TOKEN_EXPIRES_HOURS || '', 10);
  if (Number.isNaN(raw) || raw <= 0) return DEFAULT_EXPIRES_HOURS;
  return raw;
}

export function createAuthToken(payload) {
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + parseExpiryHours() * 3600
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(tokenPayload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyAuthToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [payloadPart, signaturePart] = token.split('.');
  if (!payloadPart || !signaturePart) return null;

  const expectedSignature = sign(payloadPart);
  const received = Buffer.from(signaturePart);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(received, expected)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(payloadPart));
    const now = Math.floor(Date.now() / 1000);
    if (!payload?.exp || payload.exp <= now) return null;
    return payload;
  } catch (error) {
    return null;
  }
}

