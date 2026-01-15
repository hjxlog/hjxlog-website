/**
 * 知识库管理路由
 * 提供 API 接口管理知识库内容
 */
import express from 'express';
import KnowledgeBaseService from '../services/KnowledgeBaseService.js';

/**
 * 创建知识库管理路由
 * @param {Function} getDbClient - 数据库客户端获取函数
 * @returns {express.Router}
 */
export function createKnowledgeBaseRouter(getDbClient) {
  const router = express.Router();

  /**
   * POST /api/knowledge-base/blog/:id
   * 添加或更新博客到知识库
   */
  router.post('/blog/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const dbClient = getDbClient();
      const service = new KnowledgeBaseService(dbClient);

      const result = await service.addBlog(parseInt(id));

      res.json({
        success: result.success,
        message: result.message,
        chunks: result.chunks,
      });
    } catch (error) {
      console.error('[KnowledgeBase] API error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * POST /api/knowledge-base/work/:id
   * 添加或更新作品到知识库
   */
  router.post('/work/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const dbClient = getDbClient();
      const service = new KnowledgeBaseService(dbClient);

      const result = await service.addWork(parseInt(id));

      res.json({
        success: result.success,
        message: result.message,
        chunks: result.chunks,
      });
    } catch (error) {
      console.error('[KnowledgeBase] API error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * DELETE /api/knowledge-base/blog/:id
   * 从知识库删除博客
   */
  router.delete('/blog/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const dbClient = getDbClient();
      const service = new KnowledgeBaseService(dbClient);

      const result = await service.deleteBlog(parseInt(id));

      res.json({
        success: result.success,
        deleted: result.deleted,
      });
    } catch (error) {
      console.error('[KnowledgeBase] API error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * DELETE /api/knowledge-base/work/:id
   * 从知识库删除作品
   */
  router.delete('/work/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const dbClient = getDbClient();
      const service = new KnowledgeBaseService(dbClient);

      const result = await service.deleteWork(parseInt(id));

      res.json({
        success: result.success,
        deleted: result.deleted,
      });
    } catch (error) {
      console.error('[KnowledgeBase] API error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * POST /api/knowledge-base/photo/:id
   * 添加或更新照片到知识库
   */
  router.post('/photo/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const dbClient = getDbClient();
      const service = new KnowledgeBaseService(dbClient);

      const result = await service.addPhoto(parseInt(id));

      res.json({
        success: result.success,
        message: result.message,
        chunks: result.chunks,
      });
    } catch (error) {
      console.error('[KnowledgeBase] API error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * DELETE /api/knowledge-base/photo/:id
   * 从知识库删除照片
   */
  router.delete('/photo/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const dbClient = getDbClient();
      const service = new KnowledgeBaseService(dbClient);

      const result = await service.deletePhoto(parseInt(id));

      res.json({
        success: result.success,
        deleted: result.deleted,
      });
    } catch (error) {
      console.error('[KnowledgeBase] API error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * GET /api/knowledge-base/list
   * 获取知识库内容列表（按源分组）
   */
  router.get('/list', async (req, res) => {
    try {
      const { page, limit, source_type } = req.query;

      console.log('[KnowledgeBase Router] 列表请求:', { page, limit, source_type });

      const dbClient = getDbClient();
      const service = new KnowledgeBaseService(dbClient);

      const result = await service.getList({
        page: page || 1,
        limit: limit || 20,
        sourceType: source_type,
      });

      console.log('[KnowledgeBase Router] 列表响应:', result);

      res.json({
        success: result.success,
        data: result.data,
        total: result.total,
      });
    } catch (error) {
      console.error('[KnowledgeBase] API error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * GET /api/knowledge-base/chunks/:sourceType/:sourceId
   * 获取某个源的所有 chunk 详情
   */
  router.get('/chunks/:sourceType/:sourceId', async (req, res) => {
    try {
      const { sourceType, sourceId } = req.params;

      console.log('[KnowledgeBase] 获取 chunks:', { sourceType, sourceId });

      const dbClient = getDbClient();
      const service = new KnowledgeBaseService(dbClient);

      const result = await service.getChunks(sourceType, parseInt(sourceId));

      console.log('[KnowledgeBase] 获取 chunks 结果:', result);

      res.json({
        success: result.success,
        data: result.data,
      });
    } catch (error) {
      console.error('[KnowledgeBase] API error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * POST /api/knowledge-base/rebuild
   * 重建整个知识库
   */
  router.post('/rebuild', async (req, res) => {
    try {
      const { blogs, works } = req.body;

      const dbClient = getDbClient();
      const service = new KnowledgeBaseService(dbClient);

      // 异步执行重建
      const rebuildPromise = service.rebuildAll({
        blogs: blogs !== false,
        works: works !== false,
      });

      // 不等待完成，立即返回
      rebuildPromise.then(result => {
        console.log('[KnowledgeBase] 重建完成:', result.stats);
      }).catch(error => {
        console.error('[KnowledgeBase] 重建失败:', error);
      });

      res.json({
        success: true,
        message: '知识库重建已启动，请稍后查看结果',
      });
    } catch (error) {
      console.error('[KnowledgeBase] API error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * POST /api/knowledge-base/rebuild-sync
   * 重建整个知识库（同步，用于测试）
   */
  router.post('/rebuild-sync', async (req, res) => {
    try {
      const { blogs, works, photos } = req.body;

      const dbClient = getDbClient();
      const service = new KnowledgeBaseService(dbClient);

      const result = await service.rebuildAll({
        blogs: blogs !== false,
        works: works !== false,
        photos: photos !== false,
      });

      res.json({
        success: result.success,
        stats: result.stats,
        message: `重建完成：博客 ${result.stats.totalBlogs} 篇，作品 ${result.stats.totalWorks} 个，照片 ${result.stats.totalPhotos} 张，文档块 ${result.stats.totalChunks} 个`,
      });
    } catch (error) {
      console.error('[KnowledgeBase] API error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * GET /api/knowledge-base/stats
   * 获取知识库统计信息
   */
  router.get('/stats', async (req, res) => {
    try {
      const dbClient = getDbClient();

      // 获取各类型统计
      const typeStats = await dbClient.query(`
        SELECT
          source_type,
          COUNT(DISTINCT source_id) as count,
          COUNT(*) as total_chunks
        FROM knowledge_base
        GROUP BY source_type
      `);

      // 获取总数
      const totalResult = await dbClient.query(
        'SELECT COUNT(*) as total FROM knowledge_base'
      );

      // 获取最后更新时间
      const lastUpdate = await dbClient.query(`
        SELECT MAX(created_at) as last_updated
        FROM knowledge_base
      `);

      const stats = {
        total: parseInt(totalResult.rows[0].total),
        byType: {},
        lastUpdated: lastUpdate.rows[0].last_updated,
      };

      for (const row of typeStats.rows) {
        stats.byType[row.source_type] = {
          items: parseInt(row.count),
          chunks: parseInt(row.total_chunks),
        };
      }

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('[KnowledgeBase] API error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  return router;
}
