/**
 * AI 聊天路由
 * 提供 SSE 流式聊天接口
 */
import express from 'express';
import RAGService from '../services/RAGService.js';

/**
 * 创建聊天路由
 * @param {Function} getDbClient - 数据库客户端获取函数
 * @returns {express.Router}
 */
export function createChatRouter(getDbClient) {
  const router = express.Router();

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

    // 设置 SSE 头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const dbClient = getDbClient();
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

  return router;
}
