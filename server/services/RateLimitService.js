/**
 * AI 聊天访问限制服务
 * 限制每个 IP 和全局每天的访问次数
 */
class RateLimitService {
  constructor(dbClient, dailyLimit = 3, globalDailyLimit = 100) {
    this.db = dbClient;
    this.dailyLimit = dailyLimit;
    this.globalDailyLimit = globalDailyLimit;
  }

  /**
   * 初始化全局限制表
   */
  async initGlobalLimit() {
    try {
      // 创建全局使用量记录表（单行记录）
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS chat_global_usage (
          id SERIAL PRIMARY KEY,
          request_date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
          total_requests INTEGER NOT NULL DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 创建索引
      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_chat_global_usage_date
        ON chat_global_usage(request_date)
      `);

      // 初始化今天的记录
      const today = new Date().toISOString().split('T')[0];
      await this.db.query(`
        INSERT INTO chat_global_usage (request_date, total_requests)
        VALUES ($1, 0)
        ON CONFLICT (request_date) DO NOTHING
      `, [today]);

      console.log('[RateLimit] Global limit table initialized');
    } catch (error) {
      console.error('[RateLimit] Failed to init global limit:', error);
    }
  }

  /**
   * 获取全局使用量
   */
  async getGlobalUsage() {
    const today = new Date().toISOString().split('T')[0];

    try {
      const result = await this.db.query(
        `SELECT total_requests FROM chat_global_usage
         WHERE request_date = $1`,
        [today]
      );

      const total = result.rows[0]?.total_requests || 0;
      return {
        total,
        remaining: Math.max(0, this.globalDailyLimit - total),
      };
    } catch (error) {
      console.error('[RateLimit] Get global usage error:', error);
      return { total: 0, remaining: this.globalDailyLimit };
    }
  }

  /**
   * 增加全局使用量
   */
  async incrementGlobalUsage() {
    const today = new Date().toISOString().split('T')[0];

    try {
      await this.db.query(
        `INSERT INTO chat_global_usage (request_date, total_requests)
         VALUES ($1, 1)
         ON CONFLICT (request_date)
         DO UPDATE SET
           total_requests = chat_global_usage.total_requests + 1,
           updated_at = CURRENT_TIMESTAMP
         RETURNING total_requests`,
        [today]
      );
    } catch (error) {
      console.error('[RateLimit] Increment global usage error:', error);
      throw error;
    }
  }

  /**
   * 检查并增加访问次数（同时检查 IP 和全局限制）
   * @param {string} ipAddress - 客户端 IP 地址
   * @returns {Promise<{allowed: boolean, remaining: number, resetAt?: Date, reason?: string}>}
   */
  async checkAndIncrement(ipAddress) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      // 1. 先检查全局限制
      const globalUsage = await this.getGlobalUsage();
      if (globalUsage.total >= this.globalDailyLimit) {
        return {
          allowed: false,
          remaining: 0,
          reason: 'global',
          globalRemaining: 0,
          globalLimit: this.globalDailyLimit,
        };
      }

      // 2. 检查 IP 限制
      await this.db.query(
        `INSERT INTO chat_rate_limits (ip_address, request_date, request_count)
         VALUES ($1, $2, 1)
         ON CONFLICT (ip_address, request_date)
         DO UPDATE SET
           request_count = chat_rate_limits.request_count + 1,
           updated_at = CURRENT_TIMESTAMP`,
        [ipAddress, today]
      );

      const ipResult = await this.db.query(
        `SELECT request_count FROM chat_rate_limits
         WHERE ip_address = $1 AND request_date = $2`,
        [ipAddress, today]
      );

      const ipCount = ipResult.rows[0].request_count;

      // 3. 检查 IP 是否超限
      if (ipCount > this.dailyLimit) {
        return {
          allowed: false,
          remaining: 0,
          reason: 'ip',
        };
      }

      // 4. 增加全局计数
      await this.incrementGlobalUsage();

      // 5. 获取最新的全局使用量
      const newGlobalUsage = await this.getGlobalUsage();

      const ipRemaining = Math.max(0, this.dailyLimit - ipCount);

      // 计算重置时间（明天 0点）
      const resetAt = new Date(today);
      resetAt.setDate(resetAt.getDate() + 1);
      resetAt.setHours(0, 0, 0, 0);

      return {
        allowed: true,
        remaining: ipRemaining,
        resetAt,
        globalRemaining: newGlobalUsage.remaining,
        globalLimit: this.globalDailyLimit,
      };
    } catch (error) {
      console.error('[RateLimit] Error:', error);
      // 出错时允许访问，但记录日志
      return {
        allowed: true,
        remaining: this.dailyLimit,
        globalRemaining: this.globalDailyLimit,
        globalLimit: this.globalDailyLimit,
      };
    }
  }

  /**
   * 获取当前访问状态（不增加计数）
   * @param {string} ipAddress - 客户端 IP 地址
   * @returns {Promise<{remaining: number, resetAt?: Date, globalRemaining: number, globalLimit: number}>}
   */
  async getStatus(ipAddress) {
    const today = new Date().toISOString().split('T')[0];

    try {
      // 获取 IP 使用量
      const ipResult = await this.db.query(
        `SELECT request_count FROM chat_rate_limits
         WHERE ip_address = $1 AND request_date = $2`,
        [ipAddress, today]
      );

      const ipCount = ipResult.rows[0]?.request_count || 0;
      const ipRemaining = Math.max(0, this.dailyLimit - ipCount);

      // 获取全局使用量
      const globalUsage = await this.getGlobalUsage();

      // 计算重置时间
      const resetAt = new Date(today);
      resetAt.setDate(resetAt.getDate() + 1);
      resetAt.setHours(0, 0, 0, 0);

      return {
        remaining: ipRemaining,
        resetAt,
        globalRemaining: globalUsage.remaining,
        globalLimit: this.globalDailyLimit,
      };
    } catch (error) {
      console.error('[RateLimit] Error:', error);
      return {
        remaining: this.dailyLimit,
        globalRemaining: this.globalDailyLimit,
        globalLimit: this.globalDailyLimit,
      };
    }
  }

  /**
   * 重置指定 IP 的访问次数（管理员功能）
   * @param {string} ipAddress - 客户端 IP 地址
   * @returns {Promise<boolean>}
   */
  async reset(ipAddress) {
    try {
      await this.db.query(
        `DELETE FROM chat_rate_limits
         WHERE ip_address = $1`,
        [ipAddress]
      );
      return true;
    } catch (error) {
      console.error('[RateLimit] Reset error:', error);
      return false;
    }
  }

  /**
   * 清理过期数据（保留最近 30 天）
   * @returns {Promise<number>} 删除的行数
   */
  async cleanup() {
    try {
      const result = await this.db.query(
        `DELETE FROM chat_rate_limits
         WHERE request_date < CURRENT_DATE - INTERVAL '30 days'`
      );

      await this.db.query(
        `DELETE FROM chat_global_usage
         WHERE request_date < CURRENT_DATE - INTERVAL '30 days'`
      );

      return result.rowCount || 0;
    } catch (error) {
      console.error('[RateLimit] Cleanup error:', error);
      return 0;
    }
  }
}

export default RateLimitService;
