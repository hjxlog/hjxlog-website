/**
 * 每日工作总结 API
 */
import express from 'express';
import {
  getDailyReportByDate,
  getDailyReportsList,
  upsertDailyReport,
  generateDailyReport
} from '../services/DailyReportService.js';

const router = express.Router();

const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 获取今天日报
 * GET /api/daily-reports/today
 */
router.get('/daily-reports/today', async (req, res) => {
  try {
    const today = getLocalDateString();
    const report = await getDailyReportByDate(today);
    res.json({
      success: true,
      data: report,
      today
    });
  } catch (error) {
    console.error('Error fetching today report:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 生成今天日报（覆盖当天）
 * POST /api/daily-reports/today/generate
 */
router.post('/daily-reports/today/generate', async (req, res) => {
  try {
    const report = await generateDailyReport({ dateString: getLocalDateString() });
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating daily report:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取指定日期日报
 * GET /api/daily-reports/:date
 */
router.get('/daily-reports/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }
    const report = await getDailyReportByDate(date);
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching report:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 更新指定日期日报内容
 * PUT /api/daily-reports/:date
 */
router.put('/daily-reports/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { content } = req.body;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    const existing = await getDailyReportByDate(date);
    const report = await upsertDailyReport({
      reportDate: date,
      content: content.trim(),
      sourcePayload: existing?.source_payload || {}
    });

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error updating report:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取日报列表
 * GET /api/daily-reports?page=1&limit=30
 */
router.get('/daily-reports', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const result = await getDailyReportsList(page, limit);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching reports list:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
