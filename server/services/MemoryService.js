import { ZhipuAI } from 'zhipuai';

/**
 * Task Memory 功能 - 核心服务层
 * 功能：每日想法记录 + AI 自动总结到长期记忆
 */

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
    SELECT id, thought_date, content, mood, tags, is_summarized, created_at, updated_at
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
 * @param {string} data.content - 想法内容（Markdown）
 * @param {string} [data.mood] - 心情
 * @param {string[]} [data.tags] - 标签数组
 * @returns {Object} 创建或更新后的想法
 */
export async function createOrUpdateTodayThought({ content, mood, tags }) {
  const client = getDbClient();
  const today = getLocalDateString();

  const existingQuery = `
    SELECT id
    FROM daily_thoughts
    WHERE thought_date = $1
    LIMIT 1
  `;
  const existingResult = await client.query(existingQuery, [today]);
  const exists = existingResult.rows.length > 0;

  if (exists) {
    const query = `
      UPDATE daily_thoughts
      SET content = $1, mood = $2, tags = $3, updated_at = CURRENT_TIMESTAMP
      WHERE thought_date = $4
      RETURNING *
    `;
    const result = await client.query(query, [content, mood, tags, today]);
    return result.rows[0];
  }

  const query = `
    INSERT INTO daily_thoughts (thought_date, content, mood, tags)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await client.query(query, [today, content, mood, tags]);
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
  const total = parseInt(countResult.rows[0].total);

  const dataQuery = `
    SELECT id, thought_date, content, mood, tags, is_summarized, created_at, updated_at
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
 * 检查指定日期是否可编辑
 * @param {string} date - 日期字符串 (YYYY-MM-DD)
 * @returns {boolean} 是否可编辑
 */
export function canEditThought(date) {
  const today = getLocalDateString();
  return date === today;
}

/**
 * 调用智谱 AI 生成总结
 * @param {string} dailyContent - 每日想法内容
 * @returns {Object} { title, content, category, importance }
 */
export async function generateAISummary(dailyContent) {
  const apiKey = process.env.ZHIPU_API_KEY;
  if (!apiKey) {
    throw new Error('ZHIPU_API_KEY not configured');
  }

  const client = new ZhipuAI({ apiKey });

  const prompt = `请总结以下每日想法，提炼出重要内容。

输出JSON格式（只返回JSON，不要其他文字）：
{
  "title": "简短的标题（10字以内）",
  "content": "精炼内容（200字以内，保留核心洞察）",
  "category": "分类（决策/教训/洞察/其他）",
  "importance": 7
}

原始想法：
${dailyContent}`;

  try {
    const response = await client.chat.completions.create({
      model: 'glm-4-flash',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    });

    const aiContent = response.choices[0].message.content.trim();
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('AI response format invalid');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('AI summary generation failed:', error.message);
    throw error;
  }
}

/**
 * 保存到长期记忆
 * @param {Object} data - 记忆数据
 * @param {string} data.title - 标题
 * @param {string} data.content - 内容
 * @param {string} data.source_date - 来源日期
 * @param {string} data.category - 分类
 * @param {number} data.importance - 重要性
 * @param {string[]} [data.tags] - 标签
 * @returns {Object} 创建的记忆
 */
export async function saveToLongTermMemory({ title, content, source_date, category, importance, tags }) {
  const client = getDbClient();
  const query = `
    INSERT INTO long_term_memory (title, content, source_date, category, importance, tags)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const result = await client.query(query, [title, content, source_date, category, importance, tags || []]);
  return result.rows[0];
}

/**
 * 标记指定日期的想法为已总结
 * @param {string} date - 日期字符串 (YYYY-MM-DD)
 * @returns {boolean} 是否成功
 */
export async function markAsSummarized(date) {
  const client = getDbClient();
  const query = `
    UPDATE daily_thoughts
    SET is_summarized = true
    WHERE thought_date = $1
  `;
  await client.query(query, [date]);
  return true;
}

/**
 * 获取长期记忆列表（分页）
 * @param {Object} options - 查询选项
 * @param {number} [options.page] - 页码
 * @param {number} [options.limit] - 每页数量
 * @param {string} [options.category] - 分类过滤
 * @returns {Object} { data: [], total, page }
 */
export async function getLongTermMemories({ page = 1, limit = 20, category } = {}) {
  const client = getDbClient();
  const offset = (page - 1) * limit;

  let whereClause = '';
  const params = [];
  let paramIndex = 1;

  if (category) {
    whereClause = `WHERE category = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }

  const countQuery = `SELECT COUNT(*) as total FROM long_term_memory ${whereClause}`;
  const countResult = await client.query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

  params.push(limit, offset);
  const dataQuery = `
    SELECT id, title, content, source_date, category, importance, tags, created_at, updated_at
    FROM long_term_memory
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  const dataResult = await client.query(dataQuery, params);

  return {
    data: dataResult.rows,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * 总结指定日期的想法
 * @param {string} date - 日期字符串 (YYYY-MM-DD)
 * @returns {Object} { thought, memory }
 */
export async function summarizeDailyThought(date) {
  const thought = await getDailyThoughtByDate(date);
  if (!thought) {
    throw new Error(`No thought found for date: ${date}`);
  }

  if (thought.is_summarized) {
    return { thought, message: 'Already summarized' };
  }

  const summary = await generateAISummary(thought.content);

  const memory = await saveToLongTermMemory({
    title: summary.title,
    content: summary.content,
    source_date: date,
    category: summary.category,
    importance: summary.importance
  });

  await markAsSummarized(date);

  return { thought, memory };
}

function getYesterdayDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getLocalDateString(yesterday);
}

/**
 * 定时任务：每天午夜总结昨天的想法
 * 导出给 cron 使用
 */
export async function dailySummarizationTask() {
  console.log(`📡 [${new Date().toISOString()}] 开始执行每日总结任务...`);

  try {
    const yesterday = getYesterdayDate();
    const thought = await getDailyThoughtByDate(yesterday);

    if (!thought) {
      console.log('✓ 昨天没有想法，跳过总结');
      return;
    }

    if (thought.is_summarized) {
      console.log('✓ 昨天的想法已总结，跳过');
      return;
    }

    const result = await summarizeDailyThought(yesterday);
    console.log(`✅ 想法总结成功: ${result.memory.title}`);
  } catch (error) {
    console.error('❌ 每日总结任务失败:', error.message);
  }
}
