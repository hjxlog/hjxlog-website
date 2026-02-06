import cron from 'node-cron';
import { runDailySignalJob } from '../services/aiSignalService.js';

let isRunning = false;

export function scheduleAiSignalJob(getDbClient, logger) {
  const cronExpr = process.env.AI_SIGNAL_CRON || '0 8 * * *';
  const timezone = process.env.AI_SIGNAL_TZ || undefined;

  cron.schedule(cronExpr, async () => {
    if (isRunning) return;
    const dbClient = getDbClient();
    if (!dbClient) return;
    isRunning = true;
    try {
      await runDailySignalJob(dbClient);
      if (logger) {
        await logger.system('ai-signal', 'daily-job', '每日情报任务完成');
      }
    } catch (error) {
      if (logger) {
        await logger.error('ai-signal', 'daily-job', error);
      }
    } finally {
      isRunning = false;
    }
  }, timezone ? { timezone } : undefined);
}
