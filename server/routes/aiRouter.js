import express from 'express';
import PromptService from '../services/PromptService.js';
import LLMService from '../services/LLMService.js';

export function createAIRouter(getDbClient) {
  const router = express.Router();
  const llmService = new LLMService();

  /**
   * POST /api/ai/generate-summary
   * 生成博客摘要
   */
  router.post('/generate-summary', async (req, res) => {
    try {
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          error: '缺少 content 参数',
        });
      }

      const dbClient = getDbClient();
      const promptService = new PromptService(dbClient);

      // 1. 获取提示词模板
      const templateResult = await promptService.getTemplate('blog_summary');
      if (!templateResult.success || !templateResult.data) {
        return res.status(500).json({
          success: false,
          error: '提示词模板 blog_summary 缺失，请先初始化 prompt_templates 数据。',
        });
      }
      const template = templateResult.data;

      // 2. 构建 Prompt
      const userPrompt = template.user_prompt_template.replace('{content}', content);
      
      const prompt = {
        system: template.system_prompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      };

      // 3. 调用 LLM
      console.log('[AIRouter] 正在调用 AI 生成摘要...');
      const summary = await llmService.chat(prompt);

      res.json({
        success: true,
        data: {
          summary: summary.trim(),
        },
      });

    } catch (error) {
      console.error('[AIRouter] 生成摘要失败:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/ai/generate-tags
   * 生成博客标签
   */
  router.post('/generate-tags', async (req, res) => {
    try {
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          error: '缺少 content 参数',
        });
      }

      const dbClient = getDbClient();
      const promptService = new PromptService(dbClient);

      // 1. 获取现有标签
      let existingTags = [];
      try {
        const tagsResult = await dbClient.query('SELECT DISTINCT unnest(tags) as tag FROM blogs');
        existingTags = tagsResult.rows.map(row => row.tag);
      } catch (err) {
        console.warn('[AIRouter] 获取现有标签失败:', err);
        // 不中断流程，只是没有参考标签
      }

      // 2. 获取提示词模板
      const templateResult = await promptService.getTemplate('blog_tags');
      if (!templateResult.success || !templateResult.data) {
        return res.status(500).json({
          success: false,
          error: '提示词模板 blog_tags 缺失，请先初始化 prompt_templates 数据。',
        });
      }
      const template = templateResult.data;

      // 3. 构建 Prompt
      const userPrompt = template.user_prompt_template
        .replace('{existing_tags}', existingTags.join(', '))
        .replace('{content}', content);
      
      const prompt = {
        system: template.system_prompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      };

      // 4. 调用 LLM
      console.log('[AIRouter] 正在调用 AI 生成标签...');
      const responseText = await llmService.chat(prompt);

      // 5. 解析 JSON
      let tags = [];
      try {
        // 尝试提取 JSON 部分（防止 LLM 输出多余的 Markdown 标记）
        const jsonMatch = responseText.match(/\[.*\]/s);
        const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
        tags = JSON.parse(jsonStr);
      } catch (e) {
        console.error('[AIRouter] 解析 AI 返回的标签 JSON 失败:', responseText);
        // 降级处理：如果是逗号分隔的字符串
        tags = responseText.split(/[,，]/).map(t => t.trim()).filter(t => t);
      }
      
      // 再次限制数量
      if (Array.isArray(tags)) {
          tags = tags.slice(0, 5);
      } else {
          tags = [];
      }

      res.json({
        success: true,
        data: {
          tags: tags,
        },
      });

    } catch (error) {
      console.error('[AIRouter] 生成标签失败:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/ai/generate-category
   * 生成博客分类
   */
  router.post('/generate-category', async (req, res) => {
    try {
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          error: '缺少 content 参数',
        });
      }

      const dbClient = getDbClient();
      const promptService = new PromptService(dbClient);

      // 1. 获取现有分类
      let existingCategories = [];
      try {
        const categoriesResult = await dbClient.query('SELECT DISTINCT category FROM blogs WHERE category IS NOT NULL AND category != \'\'');
        existingCategories = categoriesResult.rows.map(row => row.category);
      } catch (err) {
        console.warn('[AIRouter] 获取现有分类失败:', err);
      }

      // 2. 获取提示词模板
      const templateResult = await promptService.getTemplate('blog_category');
      if (!templateResult.success || !templateResult.data) {
        return res.status(500).json({
          success: false,
          error: '提示词模板 blog_category 缺失，请先初始化 prompt_templates 数据。',
        });
      }
      const template = templateResult.data;

      // 3. 构建 Prompt
      const userPrompt = template.user_prompt_template
        .replace('{existing_categories}', existingCategories.join(', '))
        .replace('{content}', content);
      
      const prompt = {
        system: template.system_prompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      };

      // 4. 调用 LLM
      console.log('[AIRouter] 正在调用 AI 生成分类...');
      const category = await llmService.chat(prompt);

      res.json({
        success: true,
        data: {
          category: category.trim().replace(/['"《》]/g, ''), // 去除可能的多余引号
        },
      });

    } catch (error) {
      console.error('[AIRouter] 生成分类失败:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  return router;
}
