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

      // 1. 获取或创建提示词模板
      let templateResult = await promptService.getTemplate('blog_summary');
      let template;

      if (!templateResult.success || !templateResult.data) {
        console.log('[AIRouter] 模板 blog_summary 不存在，正在创建默认模板...');
        // 创建默认模板
        const defaultTemplate = {
          name: 'blog_summary',
          display_name: '博客摘要生成',
          scenario: 'content_generation',
          keywords: ['summary', 'blog', 'abstract'],
          system_prompt: '你是一个专业的博客编辑，擅长总结文章摘要。',
          user_prompt_template: `请阅读以下博客内容，并生成一段约200字的摘要。摘要应简洁明了，概括文章的核心观点和主要内容。不要使用Markdown格式，直接输出纯文本。

博客内容：
{content}`,
          variables: ['{content}'],
        };

        const createResult = await promptService.createTemplate(defaultTemplate);
        if (!createResult.success) {
          throw new Error(`创建默认模板失败: ${createResult.error}`);
        }
        template = createResult.data;
      } else {
        template = templateResult.data;
      }

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

      // 2. 获取或创建提示词模板
      let templateResult = await promptService.getTemplate('blog_tags');
      let template;

      if (!templateResult.success || !templateResult.data) {
        console.log('[AIRouter] 模板 blog_tags 不存在，正在创建默认模板...');
        // 创建默认模板
        const defaultTemplate = {
          name: 'blog_tags',
          display_name: '博客标签生成',
          scenario: 'content_generation',
          keywords: ['tags', 'blog', 'classification'],
          system_prompt: '你是一个专业的博客编辑，擅长对文章进行分类和打标签。',
          user_prompt_template: `请阅读以下博客内容，并生成2-5个最相关的标签。
请遵循以下规则：
1. 优先使用【现有标签列表】中已有的标签，如果它们适用的话。
2. 只有在现有标签都不适用时，才创建新的标签。
3. 标签数量控制在2-5个之间，最好是2-3个。
4. 输出格式必须是严格的JSON字符串数组，例如：["React", "JavaScript"]。不要包含任何Markdown标记或其他文字。

现有标签列表：
{existing_tags}

博客内容：
{content}`,
          variables: ['{existing_tags}', '{content}'],
        };

        const createResult = await promptService.createTemplate(defaultTemplate);
        if (!createResult.success) {
          throw new Error(`创建默认模板失败: ${createResult.error}`);
        }
        template = createResult.data;
      } else {
        template = templateResult.data;
      }

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

      // 2. 获取或创建提示词模板
      let templateResult = await promptService.getTemplate('blog_category');
      let template;

      if (!templateResult.success || !templateResult.data) {
        console.log('[AIRouter] 模板 blog_category 不存在，正在创建默认模板...');
        // 创建默认模板
        const defaultTemplate = {
          name: 'blog_category',
          display_name: '博客分类生成',
          scenario: 'content_generation',
          keywords: ['category', 'blog', 'classification'],
          system_prompt: '你是一个专业的博客编辑，擅长对文章进行分类。',
          user_prompt_template: `请阅读以下博客内容，并为其选择一个最合适的分类。
请遵循以下规则：
1. 优先从【现有分类列表】中选择一个最匹配的分类。
2. 如果现有分类都不合适，请根据文章内容创建一个新的、简洁的分类名称（不超过6个字）。
3. 只输出一个分类名称，不要包含任何其他文字或标点符号。

现有分类列表：
{existing_categories}

博客内容：
{content}`,
          variables: ['{existing_categories}', '{content}'],
        };

        const createResult = await promptService.createTemplate(defaultTemplate);
        if (!createResult.success) {
          throw new Error(`创建默认模板失败: ${createResult.error}`);
        }
        template = createResult.data;
      } else {
        template = templateResult.data;
      }

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
