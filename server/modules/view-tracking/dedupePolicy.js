import crypto from 'crypto';

function dedupeWindowMinutes() {
  const val = Number.parseInt(process.env.VIEW_DEDUPE_WINDOW_MINUTES || '30', 10);
  if (Number.isNaN(val) || val <= 0) return 30;
  return val;
}

function timeBucket(date = new Date()) {
  const minutes = dedupeWindowMinutes();
  const bucketMs = minutes * 60 * 1000;
  return Math.floor(date.getTime() / bucketMs);
}

export function buildDedupeKey({ targetType, targetId, path, visitorIdentity, now = new Date() }) {
  const payload = [
    targetType || 'unknown',
    Number(targetId || 0),
    path || '',
    visitorIdentity || 'unknown',
    String(timeBucket(now))
  ].join('|');

  return crypto.createHash('sha256').update(payload).digest('hex');
}
