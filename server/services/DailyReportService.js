/**
 * Daily Report 服务
 * 生成与存储每日工作总结
 */
import LLMService from './LLMService.js';
import PromptService from './PromptService.js';

let dbClientGetter = null;

export function setDailyReportDbClientGetter(getter) {
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

export async function getDailyReportByDate(dateString) {
  const db = getDbClient();
  const result = await db.query(
    `SELECT id, report_date, content, source_payload, created_at, updated_at
     FROM daily_reports
     WHERE report_date = $1`,
    [dateString]
  );
  return result.rows[0] || null;
}

export async function getDailyReportsList(page = 1, limit = 30) {
  const db = getDbClient();
  const offset = (page - 1) * limit;
  const listResult = await db.query(
    `SELECT id, report_date, content, created_at, updated_at
     FROM daily_reports
     ORDER BY report_date DESC, updated_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const countResult = await db.query('SELECT COUNT(*)::int AS total FROM daily_reports');

  return {
    reports: listResult.rows,
    total: countResult.rows[0]?.total || 0,
    page,
    limit
  };
}

export async function upsertDailyReport({ reportDate, content, sourcePayload = {} }) {
  const db = getDbClient();
  const result = await db.query(
    `INSERT INTO daily_reports (report_date, content, source_payload)
     VALUES ($1, $2, $3)
     ON CONFLICT (report_date) DO UPDATE SET
       content = EXCLUDED.content,
       source_payload = EXCLUDED.source_payload,
       updated_at = NOW()
     RETURNING id, report_date, content, source_payload, created_at, updated_at`,
    [reportDate, content, JSON.stringify(sourcePayload)]
  );
  return result.rows[0];
}

async function getTasksForDate(dateString) {
  const db = getDbClient();
  const result = await db.query(
    `SELECT t.*,
            p.name as project_name,
            p.color as project_color
     FROM tasks t
     LEFT JOIN projects p ON t.project_id = p.id
     WHERE (t.start_date::date = $1 OR t.due_date::date = $1)
     ORDER BY t.priority ASC, t.position ASC, t.created_at DESC`,
    [dateString]
  );
  return result.rows;
}

async function getThoughtForDate(dateString) {
  const db = getDbClient();
  const result = await db.query(
    `SELECT id, thought_date, content, created_at, updated_at
     FROM daily_thoughts
     WHERE thought_date = $1`,
    [dateString]
  );
  return result.rows[0] || null;
}

export async function generateDailyReport({ dateString }) {
  const reportDate = dateString || getLocalDateString();
  const [tasks, thought] = await Promise.all([
    getTasksForDate(reportDate),
    getThoughtForDate(reportDate)
  ]);

  const taskPayload = tasks.map(task => ({
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    project_name: task.project_name || '',
    tags: Array.isArray(task.tags) ? task.tags : [],
    start_date: task.start_date,
    due_date: task.due_date
  }));

  const thoughtPayload = thought
    ? {
        content: thought.content || '',
        thought_date: thought.thought_date,
        created_at: thought.created_at,
        updated_at: thought.updated_at
      }
    : null;

  const db = getDbClient();
  const promptService = new PromptService(db);
  const templateResult = await promptService.getTemplate('daily_report');

  if (!templateResult.success || !templateResult.data) {
    throw new Error('提示词模板 daily_report 缺失，请先初始化 prompt_templates 数据。');
  }

  const template = templateResult.data;
  const userPrompt = template.user_prompt_template
    .replace('{date}', reportDate)
    .replace('{tasks}', JSON.stringify(taskPayload, null, 2))
    .replace('{thoughts}', JSON.stringify(thoughtPayload, null, 2));

  const prompt = {
    system: template.system_prompt,
    messages: [{ role: 'user', content: userPrompt }]
  };

  const llm = new LLMService();
  const content = await llm.chat(prompt);

  const report = await upsertDailyReport({
    reportDate,
    content: content.trim(),
    sourcePayload: {
      tasks: taskPayload,
      thought: thoughtPayload
    }
  });

  return report;
}
