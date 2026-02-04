/**
 * Task Memory - 定时任务配置
 * 使用 node-cron 每天午夜自动总结昨天的想法
 */

import cron from 'node-cron';
import { dailySummarizationTask } from './services/MemoryService.js';

/**
 * 启动定时任务
 * Cron 表达式: '0 0 * * *' (每天 00:00)
 */
export function startMemoryCronJobs() {
  console.log('📡 [Memory] 定时任务已启动: 每天 00:00 总结昨天的想法');

  // 每天午夜执行
  cron.schedule('0 0 * * *', async () => {
    await dailySummarizationTask();
  });

  // 可选：每小时检查一次（用于测试，生产环境可移除）
  // cron.schedule('0 * * * *', async () => {
  //   console.log('📡 [Memory] 每小时检查（测试模式）');
  //   await dailySummarizationTask();
  // });
}

export { dailySummarizationTask };
