export async function upsertOpenClawDailyReport(dbClient, payload) {
  const {
    source = 'openclaw',
    reportDate,
    title,
    content,
    status = 'ok',
    tasks = [],
    metadata = {}
  } = payload;

  const result = await dbClient.query(
    `INSERT INTO openclaw_daily_reports (source, report_date, title, content, status, tasks, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (source, report_date) DO UPDATE SET
       title = EXCLUDED.title,
       content = EXCLUDED.content,
       status = EXCLUDED.status,
       tasks = EXCLUDED.tasks,
       metadata = EXCLUDED.metadata,
       updated_at = CURRENT_TIMESTAMP
     RETURNING id, source, report_date, title, content, status, tasks, metadata, created_at, updated_at`,
    [source, reportDate, title || null, content, status, JSON.stringify(tasks), JSON.stringify(metadata)]
  );

  return result.rows[0];
}
