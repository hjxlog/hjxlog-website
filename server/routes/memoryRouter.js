/**
 * Task Memory 功能 - API 路由
 * 提供每日想法和长期记忆的 RESTful 接口
 */

import express from 'express';
import {
  getDailyThoughtByDate,
  getTodayThought,
  createOrUpdateTodayThought,
  getThoughtsList,
  canEditThought,
  getLongTermMemories,
  summarizeDailyThought,
  dailySummarizationTask
} from '../services/MemoryService.js';

const router = express.Router();

/**
 * 获取指定日期的想法
 * GET /api/thoughts/:date
 * Query params: date (YYYY-MM-DD)
 */
router.get('/thoughts/:date', async (req, res) => {
  try {
    const { date } = req.params;

    // 验证日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const thought = await getDailyThoughtByDate(date);

    if (!thought) {
      return res.json({
        success: true,
        data: null,
        canEdit: canEditThought(date)
      });
    }

    res.json({
      success: true,
      data: thought,
      canEdit: canEditThought(date)
    });
  } catch (error) {
    console.error('Error fetching thought:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取今天的想法
 * GET /api/thoughts/today
 */
router.get('/thoughts/today', async (req, res) => {
  try {
    const thought = await getTodayThought();
    const today = new Date().toISOString().split('T')[0];

    res.json({
      success: true,
      data: thought,
      canEdit: true, // 今天总是可编辑
      today
    });
  } catch (error) {
    console.error('Error fetching today thought:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 创建或更新今天的想法
 * POST /api/thoughts/today
 * Body: { content, mood, tags }
 */
router.post('/thoughts/today', async (req, res) => {
  try {
    const { content, mood, tags } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    const thought = await createOrUpdateTodayThought({
      content,
      mood: mood || null,
      tags: tags || []
    });

    res.json({
      success: true,
      data: thought
    });
  } catch (error) {
    console.error('Error saving thought:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取想法列表（分页）
 * GET /api/thoughts?page=1&limit=30
 */
router.get('/thoughts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;

    const result = await getThoughtsList(page, limit);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error fetching thoughts list:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 手动触发总结指定日期的想法
 * POST /api/thoughts/summarize/:date
 */
router.post('/thoughts/summarize/:date', async (req, res) => {
  try {
    const { date } = req.params;

    // 验证日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const result = await summarizeDailyThought(date);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error summarizing thought:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取长期记忆列表（分页）
 * GET /api/memory?page=1&limit=20&category=决策
 */
router.get('/memory', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const category = req.query.category || null;

    const result = await getLongTermMemories({ page, limit, category });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error fetching long term memory:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 手动触发每日总结任务（用于测试）
 * POST /api/memory/summarize-yesterday
 */
router.post('/memory/summarize-yesterday', async (req, res) => {
  try {
    await dailySummarizationTask();

    res.json({
      success: true,
      message: 'Daily summarization task triggered'
    });
  } catch (error) {
    console.error('Error triggering summarization task:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
