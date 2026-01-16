/**
 * 提示词管理路由
 * 提供API接口管理提示词模板
 */
import express from 'express';
import PromptService from '../services/PromptService.js';

export function createPromptRouter(getDbClient) {
  const router = express.Router();

  /**
   * GET /api/prompts/templates
   * 获取所有提示词模板
   */
  router.get('/templates', async (req, res) => {
    try {
      const dbClient = getDbClient();
      const service = new PromptService(dbClient);
      const result = await service.getAllTemplates();

      res.json(result);
    } catch (error) {
      console.error('[PromptRouter] 获取模板失败:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/prompts/templates/:name
   * 获取单个提示词模板
   */
  router.get('/templates/:name', async (req, res) => {
    try {
      const { name } = req.params;
      const dbClient = getDbClient();
      const service = new PromptService(dbClient);
      const result = await service.getTemplate(name);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('[PromptRouter] 获取模板失败:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/prompts/templates
   * 创建提示词模板
   */
  router.post('/templates', async (req, res) => {
    try {
      const dbClient = getDbClient();
      const service = new PromptService(dbClient);
      const result = await service.createTemplate(req.body);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('[PromptRouter] 创建模板失败:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * PUT /api/prompts/templates/:name
   * 更新提示词模板
   */
  router.put('/templates/:name', async (req, res) => {
    try {
      const { name } = req.params;
      const dbClient = getDbClient();
      const service = new PromptService(dbClient);
      const result = await service.updateTemplate(name, req.body);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('[PromptRouter] 更新模板失败:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * DELETE /api/prompts/templates/:name
   * 删除提示词模板
   */
  router.delete('/templates/:name', async (req, res) => {
    try {
      const { name } = req.params;
      const dbClient = getDbClient();
      const service = new PromptService(dbClient);
      const result = await service.deleteTemplate(name);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('[PromptRouter] 删除模板失败:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/prompts/stats
   * 获取场景统计
   */
  router.get('/stats', async (req, res) => {
    try {
      const dbClient = getDbClient();
      const service = new PromptService(dbClient);
      const result = await service.getScenarioStats();

      res.json(result);
    } catch (error) {
      console.error('[PromptRouter] 获取统计失败:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/prompts/test
   * 测试提示词
   */
  router.post('/test', async (req, res) => {
    try {
      const { templateName, context, question } = req.body;

      if (!templateName || !context || !question) {
        return res.status(400).json({
          success: false,
          error: '缺少必要参数：templateName, context, question',
        });
      }

      const dbClient = getDbClient();
      const service = new PromptService(dbClient);
      const result = await service.testPrompt(templateName, context, question);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('[PromptRouter] 测试提示词失败:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  return router;
}
