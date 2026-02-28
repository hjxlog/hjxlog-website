import express from 'express';
import { createViewTrackingService } from '../modules/view-tracking/viewTrackingService.js';
import { resolveClientIp } from '../modules/view-tracking/ipResolver.js';

export function createViewTrackingRouter(getDbClient) {
  const router = express.Router();
  const trackingService = createViewTrackingService(getDbClient);

  router.post('/report', async (req, res) => {
    try {
      const dbClient = getDbClient();
      if (!dbClient) throw new Error('数据库未连接');

      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.json({ success: true, message: '无有效数据', data: [] });
      }

      if (String(process.env.LOG_CLIENT_IP_DEBUG || 'false').toLowerCase() === 'true') {
        const ipContext = resolveClientIp(req);
        console.log('🧭 [IP Debug] /api/view/report', ipContext.debug, {
          storableIp: ipContext.storableIp,
          ipQuality: ipContext.ipQuality
        });
      }

      const results = await trackingService.trackBatch(items, req, res);
      const inserted = results.filter((item) => item.accepted).length;
      const duplicates = results.filter((item) => item.duplicate).length;

      return res.json({
        success: true,
        data: results,
        meta: {
          processed: results.length,
          inserted,
          duplicates
        }
      });
    } catch (error) {
      console.error('❌ [API] 上报浏览失败:', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
}
