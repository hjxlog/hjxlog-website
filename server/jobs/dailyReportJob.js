import cron from 'node-cron';
import { generateDailyReport } from '../services/DailyReportService.js';

let isRunning = false;

function getDateStringByTimezone(timezone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  if (!year || !month || !day) {
    return null;
  }
  return `${year}-${month}-${day}`;
}

export function scheduleDailyReportJob(getDbClient, logger) {
  const cronExpr = process.env.DAILY_REPORT_CRON || '0 20 * * *';
  const timezone = process.env.DAILY_REPORT_TZ || 'Asia/Shanghai';

  cron.schedule(cronExpr, async () => {
    if (isRunning) return;
    const dbClient = getDbClient();
    if (!dbClient) return;

    isRunning = true;
    try {
      const dateString = timezone ? getDateStringByTimezone(timezone) : null;
      await generateDailyReport({ dateString: dateString || undefined });
      if (logger) {
        await logger.system('daily-report', 'daily-job', `每日日报任务完成: ${dateString || 'auto'}`);
      }
    } catch (error) {
      if (logger) {
        await logger.error('daily-report', 'daily-job', error);
      }
    } finally {
      isRunning = false;
    }
  }, timezone ? { timezone } : undefined);
}
