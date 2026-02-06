import express from 'express';

function normalizeStatus(input) {
  const allowed = new Set(['ok', 'warning', 'error']);
  if (!input || typeof input !== 'string') return 'ok';
  const normalized = input.trim().toLowerCase();
  return allowed.has(normalized) ? normalized : 'ok';
}

function parseTasks(tasks) {
  if (!Array.isArray(tasks)) return [];
  return tasks
    .map((task) => {
      if (typeof task === 'string') {
        return { title: task.trim(), done: null };
      }
      if (!task || typeof task !== 'object') return null;
      const title = typeof task.title === 'string' ? task.title.trim() : '';
      if (!title) return null;
      const done = typeof task.done === 'boolean' ? task.done : null;
      const detail = typeof task.detail === 'string' ? task.detail.trim() : '';
      return { title, done, detail };
    })
    .filter(Boolean);
}

export function createOpenClawReportsRouter(getDbClient) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const dbClient = getDbClient();
      if (!dbClient) throw new Error('数据库未连接');

      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
      const offset = (page - 1) * limit;

      const result = await dbClient.query(
        `SELECT id, source, report_date, title, content, status, tasks, metadata, created_at, updated_at
         FROM openclaw_daily_reports
         ORDER BY report_date DESC, created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const countResult = await dbClient.query('SELECT COUNT(*)::int AS total FROM openclaw_daily_reports');

      res.json({
        success: true,
        data: {
          reports: result.rows,
          page,
          limit,
          total: countResult.rows[0]?.total || 0
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get('/latest', async (req, res) => {
    try {
      const dbClient = getDbClient();
      if (!dbClient) throw new Error('数据库未连接');

      const result = await dbClient.query(
        `SELECT id, source, report_date, title, content, status, tasks, metadata, created_at, updated_at
         FROM openclaw_daily_reports
         ORDER BY report_date DESC, created_at DESC
         LIMIT 1`
      );

      res.json({ success: true, data: result.rows[0] || null });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get('/stats', async (req, res) => {
    try {
      const dbClient = getDbClient();
      if (!dbClient) throw new Error('数据库未连接');

      const totalResult = await dbClient.query('SELECT COUNT(*)::int AS total FROM openclaw_daily_reports');
      const last7Result = await dbClient.query(
        `SELECT COUNT(*)::int AS count
         FROM openclaw_daily_reports
         WHERE report_date >= CURRENT_DATE - INTERVAL '6 day'`
      );
      const statusResult = await dbClient.query(
        `SELECT status, COUNT(*)::int AS count
         FROM openclaw_daily_reports
         GROUP BY status`
      );

      const statusMap = { ok: 0, warning: 0, error: 0 };
      for (const row of statusResult.rows) {
        statusMap[row.status] = row.count;
      }

      res.json({
        success: true,
        data: {
          total: totalResult.rows[0]?.total || 0,
          last7Days: last7Result.rows[0]?.count || 0,
          byStatus: statusMap
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
}

export function parseOpenClawReportPayload(body = {}) {
  const reportDateRaw = typeof body.reportDate === 'string' ? body.reportDate.trim() : '';
  const parsedDate = reportDateRaw ? new Date(reportDateRaw) : new Date();
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error('reportDate 格式错误，需为可解析日期');
  }

  const reportDate = parsedDate.toISOString().slice(0, 10);
  const title = typeof body.title === 'string' ? body.title.trim() : '';

  const contentFromContent = typeof body.content === 'string' ? body.content.trim() : '';
  const contentFromSummary = typeof body.summary === 'string' ? body.summary.trim() : '';
  const content = contentFromContent || contentFromSummary;
  if (!content) {
    throw new Error('content 不能为空');
  }

  const status = normalizeStatus(body.status);
  const tasks = parseTasks(body.tasks);
  const metadata = body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
    ? body.metadata
    : {};

  return {
    reportDate,
    title,
    content,
    status,
    tasks,
    metadata
  };
}
