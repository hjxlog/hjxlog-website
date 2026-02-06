import express from 'express';
import {
  runDailySignalJob,
  getLatestDigest,
  getDigestByDate,
  saveOpinion,
  getCollectedItems
} from '../services/aiSignalService.js';

export function createAiSignalRouter(getDbClient) {
  const router = express.Router();

  router.get('/digest/latest', async (req, res) => {
    try {
      const dbClient = getDbClient();
      if (!dbClient) throw new Error('数据库未连接');
      const digest = await getLatestDigest(dbClient);
      res.json({ success: true, data: digest });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get('/digest/:date', async (req, res) => {
    try {
      const dbClient = getDbClient();
      if (!dbClient) throw new Error('数据库未连接');
      const digest = await getDigestByDate(dbClient, req.params.date);
      res.json({ success: true, data: digest });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post('/run', async (req, res) => {
    try {
      const dbClient = getDbClient();
      if (!dbClient) throw new Error('数据库未连接');
      const result = await runDailySignalJob(dbClient);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get('/items', async (req, res) => {
    try {
      const dbClient = getDbClient();
      if (!dbClient) throw new Error('数据库未连接');
      const { since, limit } = req.query;
      const sinceDate = since ? new Date(String(since)) : null;
      const result = await getCollectedItems(dbClient, {
        sinceDate: sinceDate && !Number.isNaN(sinceDate.getTime()) ? sinceDate : null,
        limit: limit ? Number(limit) : 50
      });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post('/opinion', async (req, res) => {
    try {
      const dbClient = getDbClient();
      if (!dbClient) throw new Error('数据库未连接');
      const { digestId, itemId, opinionText, assistantReply } = req.body || {};
      if (!opinionText) {
        return res.status(400).json({ success: false, message: '观点内容不能为空' });
      }
      const normalized = opinionText.trim();
      const firstSentence = normalized.split(/[\n。！？!?]/).filter(Boolean)[0] || normalized;
      const fallbackReply = `你的核心判断是：${firstSentence}。补充视角：这个判断是否忽略了实现成本或落地条件？我已记录该观点。`;
      const opinion = await saveOpinion(dbClient, {
        digestId,
        itemId,
        opinionText,
        assistantReply: assistantReply || fallbackReply
      });
      res.json({ success: true, data: opinion });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
}
