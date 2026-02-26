/**
 * 每日想法功能 - 核心服务层
 * 功能：每日想法记录与历史查询
 */
import LLMService from './LLMService.js';
import PromptService from './PromptService.js';

let dbClientGetter = null;

/**
 * 注入统一数据库客户端获取函数
 * @param {Function} getter - () => pgClient
 */
export function setMemoryDbClientGetter(getter) {
  dbClientGetter = getter;
}

function getDbClient() {
  const client = typeof dbClientGetter === 'function' ? dbClientGetter() : null;
  if (!client) {
    throw new Error('数据库未连接');
  }
  return client;
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 获取指定日期的想法
 * @param {string} date - 日期字符串 (YYYY-MM-DD)
 * @returns {Object|null} 想法对象或null
 */
export async function getDailyThoughtByDate(date) {
  const client = getDbClient();
  const query = `
    SELECT id, thought_date, content, optimized_content, created_at, updated_at
    FROM daily_thoughts
    WHERE thought_date = $1
  `;
  const result = await client.query(query, [date]);
  return result.rows[0] || null;
}

/**
 * 获取今天的想法
 * @returns {Object|null} 想法对象或null
 */
export async function getTodayThought() {
  const today = getLocalDateString();
  return getDailyThoughtByDate(today);
}

/**
 * 创建或更新今天的想法
 * @param {Object} data - 想法数据
 * @param {string} data.content - 想法内容
 * @param {string} [data.optimizedContent] - AI优化结果
 * @returns {Object} 创建或更新后的想法
 */
export async function createOrUpdateTodayThought({ content, optimizedContent }) {
  const client = getDbClient();
  const today = getLocalDateString();
  const hasOptimizedContent = typeof optimizedContent === 'string';

  const existingQuery = `
    SELECT id
    FROM daily_thoughts
    WHERE thought_date = $1
    LIMIT 1
  `;
  const existingResult = await client.query(existingQuery, [today]);
  const exists = existingResult.rows.length > 0;

  if (exists) {
    const query = hasOptimizedContent
      ? `
          UPDATE daily_thoughts
          SET content = $1, optimized_content = $2, updated_at = CURRENT_TIMESTAMP
          WHERE thought_date = $3
          RETURNING id, thought_date, content, optimized_content, created_at, updated_at
        `
      : `
          UPDATE daily_thoughts
          SET content = $1, updated_at = CURRENT_TIMESTAMP
          WHERE thought_date = $2
          RETURNING id, thought_date, content, optimized_content, created_at, updated_at
        `;
    const params = hasOptimizedContent ? [content, optimizedContent, today] : [content, today];
    const result = await client.query(query, params);
    return result.rows[0];
  }

  const query = hasOptimizedContent
    ? `
        INSERT INTO daily_thoughts (thought_date, content, optimized_content)
        VALUES ($1, $2, $3)
        RETURNING id, thought_date, content, optimized_content, created_at, updated_at
      `
    : `
        INSERT INTO daily_thoughts (thought_date, content)
        VALUES ($1, $2)
        RETURNING id, thought_date, content, optimized_content, created_at, updated_at
      `;
  const params = hasOptimizedContent ? [today, content, optimizedContent] : [today, content];
  const result = await client.query(query, params);
  return result.rows[0];
}

/**
 * 获取想法列表（分页）
 * @param {number} page - 页码
 * @param {number} limit - 每页数量
 * @returns {Object} { data: [], total, page }
 */
export async function getThoughtsList(page = 1, limit = 30) {
  const client = getDbClient();
  const offset = (page - 1) * limit;

  const countQuery = 'SELECT COUNT(*) as total FROM daily_thoughts';
  const countResult = await client.query(countQuery);
  const total = parseInt(countResult.rows[0].total, 10);

  const dataQuery = `
    SELECT id, thought_date, content, optimized_content, created_at, updated_at
    FROM daily_thoughts
    ORDER BY thought_date DESC
    LIMIT $1 OFFSET $2
  `;
  const dataResult = await client.query(dataQuery, [limit, offset]);

  return {
    data: dataResult.rows,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * 检查指定日期是否可编辑（仅今天可编辑）
 * @param {string} date - 日期字符串 (YYYY-MM-DD)
 * @returns {boolean} 是否可编辑
 */
export function canEditThought(date) {
  const today = getLocalDateString();
  return date === today;
}

/**
 * 优化当天想法为可发布动态文案
 * @param {Object} data
 * @param {string} data.date - 日期 YYYY-MM-DD
 * @param {string} [data.content] - 可选，传入最新想法文本；不传则读取数据库当天想法
 * @returns {Object} 优化结果
 */
export async function optimizeThoughtForMoment({ date, content }) {
  const sourceContent = (content || '').trim();
  let thoughtContent = sourceContent;

  if (!thoughtContent) {
    const thought = await getDailyThoughtByDate(date);
    thoughtContent = (thought?.content || '').trim();
  }

  if (!thoughtContent) {
    throw new Error('暂无可优化的想法内容，请先填写并保存当天想法。');
  }

  const db = getDbClient();
  const promptService = new PromptService(db);
  const templateResult = await promptService.getTemplate('thought_moment_polish');

  if (!templateResult.success || !templateResult.data) {
    throw new Error('提示词模板 thought_moment_polish 缺失，请先初始化 prompt_templates 数据。');
  }

  const template = templateResult.data;
  const userPrompt = template.user_prompt_template
    .replace('{date}', date)
    .replace('{thought_content}', thoughtContent);

  const prompt = {
    system: template.system_prompt,
    messages: [{ role: 'user', content: userPrompt }]
  };

  const llm = new LLMService();
  const optimizedContent = (await llm.chat(prompt)).trim();

  // 为当天记录落库优化结果，便于后续继续编辑与回看
  if (canEditThought(date)) {
    await createOrUpdateTodayThought({
      content: thoughtContent,
      optimizedContent
    });
  }

  return {
    source_content: thoughtContent,
    optimized_content: optimizedContent
  };
}
