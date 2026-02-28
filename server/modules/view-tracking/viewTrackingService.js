import { resolveClientIp } from './ipResolver.js';
import { resolveVisitorIdentity } from './visitorIdentity.js';
import { isBotUserAgent } from './botFilter.js';
import { buildDedupeKey } from './dedupePolicy.js';

async function resolveIpLocation(ip, ipQuality) {
  if (!ip || ipQuality !== 'public') return '未知位置';
  if (ip === '127.0.0.1' || ip === '::1') return '本地内网';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const data = await response.json();
    if (data.status === 'success') {
      return [data.country, data.regionName, data.city].filter(Boolean).join(' ');
    }
  } catch (error) {
    // Ignore location failures.
  }

  return '未知位置';
}

function normalizeItem(item) {
  const type = String(item?.type || '').trim();
  const id = Number.parseInt(String(item?.id ?? 0), 10);
  const path = String(item?.path || '').trim();

  if (!type) return null;
  return {
    targetType: type.slice(0, 20),
    targetId: Number.isNaN(id) ? 0 : id,
    path
  };
}

function shouldCountBot() {
  return String(process.env.VIEW_COUNT_BOTS || 'false').toLowerCase() === 'true';
}

async function updateCounter(dbClient, targetType, targetId) {
  let tableName = '';
  if (targetType === 'blog') tableName = 'blogs';
  else if (targetType === 'work') tableName = 'works';

  if (!tableName) return null;

  try {
    const result = await dbClient.query(
      `UPDATE ${tableName} SET views = COALESCE(views, 0) + 1 WHERE id = $1 RETURNING views`,
      [targetId]
    );
    return result.rows[0]?.views ?? null;
  } catch (error) {
    return null;
  }
}

export function createViewTrackingService(getDbClient) {
  async function trackOne(item, req, res) {
    const dbClient = getDbClient();
    if (!dbClient) throw new Error('数据库未连接');

    const normalized = normalizeItem(item);
    if (!normalized) {
      return {
        accepted: false,
        duplicate: false,
        reason: 'invalid_item',
        type: item?.type || '',
        id: Number(item?.id || 0)
      };
    }

    const userAgent = req.headers['user-agent'] || '';
    const ipContext = resolveClientIp(req);
    const visitor = resolveVisitorIdentity(req, res, ipContext.storableIp, userAgent);
    const ipLocation = await resolveIpLocation(ipContext.storableIp, ipContext.ipQuality);
    const isBot = isBotUserAgent(userAgent);

    const dedupeKey = buildDedupeKey({
      targetType: normalized.targetType,
      targetId: normalized.targetId,
      path: normalized.path,
      visitorIdentity: visitor.visitorIdentity
    });

    const insertResult = await dbClient.query(
      `INSERT INTO view_logs (
         target_type, target_id, ip_address, ip_location, user_agent, path,
         visitor_id, visitor_fallback_hash, ip_quality, is_bot, dedupe_key, accepted
       ) VALUES (
         $1, $2, $3, $4, $5, $6,
         $7, $8, $9, $10, $11, true
       )
       ON CONFLICT (dedupe_key) DO NOTHING
       RETURNING id`,
      [
        normalized.targetType,
        normalized.targetId,
        ipContext.storableIp,
        ipLocation,
        userAgent || null,
        normalized.path || null,
        visitor.visitorId || null,
        visitor.visitorFallbackHash || null,
        ipContext.ipQuality,
        isBot,
        dedupeKey
      ]
    );

    const inserted = insertResult.rows.length > 0;
    if (!inserted) {
      return {
        accepted: false,
        duplicate: true,
        type: normalized.targetType,
        id: normalized.targetId,
        ip: ipContext.storableIp,
        ip_quality: ipContext.ipQuality,
        is_bot: isBot
      };
    }

    let views = null;
    if (!isBot || shouldCountBot()) {
      views = await updateCounter(dbClient, normalized.targetType, normalized.targetId);
    }

    return {
      accepted: true,
      duplicate: false,
      type: normalized.targetType,
      id: normalized.targetId,
      ip: ipContext.storableIp,
      ip_quality: ipContext.ipQuality,
      is_bot: isBot,
      views
    };
  }

  async function trackBatch(items, req, res) {
    const results = await Promise.all(items.map((item) => trackOne(item, req, res)));
    return results;
  }

  return {
    trackOne,
    trackBatch
  };
}
