import Parser from 'rss-parser';

const parser = new Parser();

const SIGNAL_TYPES = [
  {
    key: 'breakthrough',
    label: '技术突破',
    keywords: [
      'breakthrough', 'state-of-the-art', 'sota', 'record', 'benchmark',
      'new model', 'architecture', 'reasoning', 'multimodal', 'transformer',
      'diffusion', 'agent', 'long-context', 'alignment', 'capability'
    ]
  },
  {
    key: 'trend',
    label: '行业趋势',
    keywords: [
      'trend', 'adoption', 'market', 'regulation', 'policy', 'standard',
      'industry', 'enterprise', 'deployment', 'governance'
    ]
  },
  {
    key: 'product',
    label: '产品更新',
    keywords: [
      'release', 'launch', 'update', 'new feature', 'beta', 'preview',
      'availability', 'pricing', 'api', 'sdk'
    ]
  },
  {
    key: 'viewpoint',
    label: '人物观点',
    keywords: [
      'opinion', 'view', 'perspective', 'lesson', 'reflection', 'postmortem',
      'talk', 'interview', 'essay', 'blog post'
    ]
  }
];

const DIRECTION_KEYWORDS = [
  { key: 'model', words: ['model', 'architecture', 'reasoning', 'alignment', 'safety'] },
  { key: 'application', words: ['application', 'product', 'use case', 'workflow', 'deployment'] },
  { key: 'engineering', words: ['engineering', 'inference', 'training', 'infra', 'system', 'optimization'] },
  { key: 'research', words: ['paper', 'research', 'benchmark', 'dataset', 'method'] },
  { key: 'safety', words: ['safety', 'alignment', 'policy', 'governance', 'risk'] }
];

const QUESTION_TEMPLATES = {
  breakthrough: '这项突破的关键假设或限制是什么？它对你的认知有什么冲击？',
  trend: '这个趋势是否会改变你未来 3-6 个月的学习或工作重点？',
  product: '这个更新会实质改变你的工作流或能力边界吗？',
  viewpoint: '你同意这个观点的核心判断吗？你会如何反驳或补充？',
  default: '它对你当前的学习路径或判断框架有何影响？'
};

function stripHtml(input) {
  if (!input) return '';
  return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function shortText(input, maxLen = 240) {
  const text = stripHtml(input || '');
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen).trim()}...`;
}

function parseDate(input) {
  if (!input) return null;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

async function discoverRssUrl(url) {
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/<link[^>]+type=["']application\/(rss|atom)\+xml["'][^>]*>/i);
    if (!match) return null;
    const hrefMatch = match[0].match(/href=["']([^"']+)["']/i);
    if (!hrefMatch) return null;
    const rssUrl = new URL(hrefMatch[1], url).toString();
    return rssUrl;
  } catch (error) {
    return null;
  }
}

function matchSignalTypes(text) {
  const lower = text.toLowerCase();
  const matched = [];
  for (const type of SIGNAL_TYPES) {
    if (type.keywords.some(word => lower.includes(word))) {
      matched.push(type.label);
    }
  }
  return matched;
}

function matchDirections(text) {
  const lower = text.toLowerCase();
  const matched = [];
  for (const dir of DIRECTION_KEYWORDS) {
    if (dir.words.some(word => lower.includes(word))) {
      matched.push(dir.key);
    }
  }
  return matched;
}

function pickPrimaryType(types) {
  if (!types || types.length === 0) return null;
  const type = SIGNAL_TYPES.find(item => item.label === types[0]);
  return type ? type.key : null;
}

function computeImportance(types, score) {
  if (score >= 0.75 || types.includes('技术突破')) return '高';
  if (score >= 0.55 || types.includes('产品更新')) return '中';
  return '低';
}

function computeScore({ recencyDays, typeCount, directionScore }) {
  const recencyBonus = recencyDays <= 1 ? 0.2 : recencyDays <= 2 ? 0.1 : 0;
  const typeBonus = Math.min(0.3, typeCount * 0.1);
  const base = directionScore || 0.5;
  return Math.min(1, base + recencyBonus + typeBonus);
}

async function getSourceWeights(dbClient, sourceId) {
  const result = await dbClient.query(
    'SELECT category, weight FROM ai_source_weights WHERE source_id = $1',
    [sourceId]
  );
  const weights = {};
  for (const row of result.rows) {
    weights[row.category] = parseFloat(row.weight);
  }
  return weights;
}

async function upsertItem(dbClient, sourceId, item) {
  const result = await dbClient.query(
    `INSERT INTO ai_source_items (source_id, title, url, summary, raw, published_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (url) DO UPDATE SET
       title = EXCLUDED.title,
       summary = EXCLUDED.summary,
       raw = EXCLUDED.raw,
       published_at = EXCLUDED.published_at,
       updated_at = NOW()
     RETURNING id`,
    [
      sourceId,
      item.title,
      item.url,
      item.summary || null,
      item.raw || {},
      item.publishedAt || null
    ]
  );
  return result.rows[0].id;
}

function buildQuestion(types) {
  const primary = pickPrimaryType(types);
  if (primary && QUESTION_TEMPLATES[primary]) {
    return QUESTION_TEMPLATES[primary];
  }
  return QUESTION_TEMPLATES.default;
}

async function buildDigestItems(dbClient, source, items, now) {
  const weights = await getSourceWeights(dbClient, source.id);
  const results = [];

  for (const item of items) {
    const publishedAt = item.publishedAt || now;
    const recencyDays = Math.floor((now - publishedAt) / (1000 * 60 * 60 * 24));
    const combinedText = `${item.title} ${item.summary || ''}`;
    const types = matchSignalTypes(combinedText);
    if (types.length === 0) continue;

    const directions = matchDirections(combinedText);
    let directionScore = 0.0;
    if (directions.length > 0) {
      directionScore = directions.reduce((sum, dir) => sum + (weights[dir] || 0.5), 0) / directions.length;
    } else {
      const fallbackWeights = Object.values(weights);
      directionScore = fallbackWeights.length > 0
        ? fallbackWeights.reduce((sum, value) => sum + value, 0) / fallbackWeights.length
        : 0.5;
    }

    const score = computeScore({ recencyDays, typeCount: types.length, directionScore });
    const importance = computeImportance(types, score);
    const question = buildQuestion(types);

    results.push({
      itemId: item.id,
      title: item.title,
      url: item.url,
      summary: item.summary || '',
      types,
      score,
      importance,
      question,
      source: source.name,
      publishedAt: item.publishedAt
    });
  }

  return results;
}

async function fetchRssItems(feedUrl) {
  const feed = await parser.parseURL(feedUrl);
  return (feed.items || []).map(item => ({
    title: item.title || 'Untitled',
    url: item.link || item.id || '',
    summary: shortText(item.contentSnippet || item.content || item.summary || ''),
    publishedAt: parseDate(item.isoDate || item.pubDate),
    raw: item
  })).filter(item => item.url);
}

async function collectSourceItems(source) {
  const rssUrl = source.rss_url || await discoverRssUrl(source.url);
  if (!rssUrl) {
    return { items: [], rssUrl: null };
  }
  const items = await fetchRssItems(rssUrl);
  return { items, rssUrl };
}

export async function runDailySignalJob(dbClient, options = {}) {
  const now = new Date();
  const maxItems = options.maxItems || 3;
  const windowDays = options.windowDays || 3;

  const sourcesResult = await dbClient.query(
    'SELECT * FROM ai_sources WHERE active = true ORDER BY id ASC'
  );

  const allCandidates = [];

  for (const source of sourcesResult.rows) {
    let items = [];
    try {
      const result = await collectSourceItems(source);
      items = result.items || [];
    } catch (error) {
      continue;
    }
    if (!items.length) continue;

    for (const item of items) {
      if (!item.publishedAt) continue;
      const deltaDays = (now - item.publishedAt) / (1000 * 60 * 60 * 24);
      if (deltaDays > windowDays) continue;

      const itemId = await upsertItem(dbClient, source.id, item);
      allCandidates.push({ ...item, id: itemId, source });
    }
  }

  let digestItems = [];
  for (const source of sourcesResult.rows) {
    const itemsBySource = allCandidates.filter(item => item.source.id === source.id);
    const enriched = await buildDigestItems(dbClient, source, itemsBySource, now);
    digestItems.push(...enriched);
  }

  digestItems = digestItems
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems);

  const digestDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const digestDateStr = digestDate.toISOString().slice(0, 10);

  if (digestItems.length === 0) {
    await dbClient.query(
      `INSERT INTO ai_daily_digests (digest_date, status, summary_text, items, empty_reason, source_window_days, max_items)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (digest_date) DO UPDATE SET
         status = EXCLUDED.status,
         summary_text = EXCLUDED.summary_text,
         items = EXCLUDED.items,
         empty_reason = EXCLUDED.empty_reason,
         source_window_days = EXCLUDED.source_window_days,
         max_items = EXCLUDED.max_items,
         updated_at = NOW()`,
      [
        digestDateStr,
        'empty',
        '今天没有值得花时间的内容。',
        JSON.stringify([]),
        'no_high_value_items',
        windowDays,
        maxItems
      ]
    );

    return { status: 'empty', items: [] };
  }

  const summaryText = `今日精选 ${digestItems.length} 条，聚焦于你应投入注意力的变化信号。`;

  await dbClient.query(
    `INSERT INTO ai_daily_digests (digest_date, status, summary_text, items, source_window_days, max_items)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (digest_date) DO UPDATE SET
       status = EXCLUDED.status,
       summary_text = EXCLUDED.summary_text,
       items = EXCLUDED.items,
       source_window_days = EXCLUDED.source_window_days,
       max_items = EXCLUDED.max_items,
       updated_at = NOW()`,
    [
      digestDateStr,
      'ready',
      summaryText,
      JSON.stringify(digestItems),
      windowDays,
      maxItems
    ]
  );

  return { status: 'ready', items: digestItems };
}

export async function getLatestDigest(dbClient) {
  const result = await dbClient.query(
    'SELECT * FROM ai_daily_digests ORDER BY digest_date DESC LIMIT 1'
  );
  return result.rows[0] || null;
}

export async function getDigestByDate(dbClient, digestDate) {
  const result = await dbClient.query(
    'SELECT * FROM ai_daily_digests WHERE digest_date = $1',
    [digestDate]
  );
  return result.rows[0] || null;
}

export async function saveOpinion(dbClient, { digestId, itemId, userId, opinionText, assistantReply }) {
  const result = await dbClient.query(
    `INSERT INTO ai_user_opinions (digest_id, item_id, user_id, opinion_text, assistant_reply)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [digestId || null, itemId || null, userId || null, opinionText, assistantReply || null]
  );
  return result.rows[0];
}
