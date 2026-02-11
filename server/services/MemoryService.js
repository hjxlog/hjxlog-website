/**
 * 每日想法功能 - 核心服务层
 * 功能：每日想法记录与历史查询
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
    SELECT id, thought_date, content, created_at, updated_at
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
 * @returns {Object} 创建或更新后的想法
 */
export async function createOrUpdateTodayThought({ content }) {
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
      SET content = $1, updated_at = CURRENT_TIMESTAMP
      WHERE thought_date = $2
      RETURNING id, thought_date, content, created_at, updated_at
    `;
    const result = await client.query(query, [content, today]);
    return result.rows[0];
  }

  const query = `
    INSERT INTO daily_thoughts (thought_date, content)
    VALUES ($1, $2)
    RETURNING id, thought_date, content, created_at, updated_at
  `;
  const result = await client.query(query, [today, content]);
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
    SELECT id, thought_date, content, created_at, updated_at
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
