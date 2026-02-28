/**
 * AI 聊天路由
 * 提供 SSE 流式聊天接口
 */
import express from 'express';
import RAGService from '../services/RAGService.js';
import RateLimitService from '../services/RateLimitService.js';
import { getClientIp } from '../utils/clientIp.js';

/**
 * 获取客户端 IP 地址
 */
function getClientIP(req) {
  return getClientIp(req) || '127.0.0.1';
}

/**
 * 创建聊天路由
 * @param {Function} getDbClient - 数据库客户端获取函数
 * @returns {express.Router}
 */
export function createChatRouter(getDbClient) {
  const router = express.Router();

  // 每日限制次数（可配置）
  const DAILY_LIMIT = parseInt(process.env.CHAT_DAILY_LIMIT || '3', 10);
  const GLOBAL_DAILY_LIMIT = parseInt(process.env.CHAT_GLOBAL_DAILY_LIMIT || '100', 10);

  // 初始化全局限制表
  const initGlobalLimit = async () => {
    try {
      const dbClient = getDbClient();
      const rateLimitService = new RateLimitService(dbClient, DAILY_LIMIT, GLOBAL_DAILY_LIMIT);
      await rateLimitService.initGlobalLimit();
    } catch (error) {
      console.error('[ChatRouter] Failed to init global limit:', error);
    }
  };

  // 异步初始化（不阻塞启动）
  initGlobalLimit();

  /**
   * POST /api/chat
   * 聊天接口 (SSE 流式)
   */
  router.post('/', async (req, res) => {
    const { message, session_id } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const dbClient = getDbClient();
    const clientIP = getClientIP(req);

    // 检查访问限制
    const rateLimitService = new RateLimitService(dbClient, DAILY_LIMIT, GLOBAL_DAILY_LIMIT);
    const rateLimit = await rateLimitService.checkAndIncrement(clientIP);

    if (!rateLimit.allowed) {
      const message = rateLimit.reason === 'global'
        ? '今日全局提问次数已达上限，请明天再试'
        : '今日提问次数已达上限';

      return res.status(429).json({
        success: false,
        message,
        reason: rateLimit.reason,
        remaining: 0,
        globalRemaining: rateLimit.globalRemaining || 0,
        resetAt: rateLimit.resetAt,
      });
    }

    // 设置 SSE 头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // 先发送剩余次数
    res.write(`data: ${JSON.stringify({
      remaining: rateLimit.remaining,
      globalRemaining: rateLimit.globalRemaining
    })}\n\n`);

    const ragService = new RAGService(dbClient);

    try {
      // 流式输出
      for await (const chunk of ragService.chat(message, session_id)) {
        res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`);
      }

      // 发送结束信号
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    } catch (error) {
      console.error('Chat error:', error);
      res.write(`data: ${JSON.stringify({ error: '抱歉，我遇到了一些问题，请稍后再试。' })}\n\n`);
    }

    res.end();
  });

  /**
   * GET /api/chat/status
   * 获取知识库状态
   */
  router.get('/status', async (req, res) => {
    try {
      const dbClient = getDbClient();
      const ragService = new RAGService(dbClient);
      const stats = await ragService.getStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Status error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * GET /api/chat/quota
   * 获取当前 IP 的访问配额
   */
  router.get('/quota', async (req, res) => {
    try {
      const dbClient = getDbClient();
      const clientIP = getClientIP(req);
      const rateLimitService = new RateLimitService(dbClient, DAILY_LIMIT, GLOBAL_DAILY_LIMIT);
      const status = await rateLimitService.getStatus(clientIP);

      res.json({
        success: true,
        data: {
          remaining: status.remaining,
          resetAt: status.resetAt,
          dailyLimit: DAILY_LIMIT,
          globalRemaining: status.globalRemaining,
          globalLimit: GLOBAL_DAILY_LIMIT,
        },
      });
    } catch (error) {
      console.error('Quota error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  return router;
}
