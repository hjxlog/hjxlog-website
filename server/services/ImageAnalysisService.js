/**
 * 图片分析服务
 * 使用智谱AI视觉模型分析图片内容，提取地点、场景等信息
 */
import { ZhipuAI } from 'zhipuai';
import PromptService from './PromptService.js';

class ImageAnalysisService {
  constructor(dbClient) {
    this.zhipuClient = new ZhipuAI({
      apiKey: process.env.ZHIPU_API_KEY,
    });
    this.promptService = new PromptService(dbClient);
  }

  /**
   * 分析图片内容
   * @param {string} imageUrl - 图片URL
   * @param {Object} metadata - 图片元数据（标题、描述、地点等）
   * @returns {Promise<{success: boolean, analysis: string, error?: string}>}
   */
  async analyzeImage(imageUrl, metadata = {}) {
    try {
      console.log(`[ImageAnalysis] 开始分析图片: ${imageUrl}`);

      // 构建分析提示词
      const { systemPrompt, userPrompt } = await this.buildAnalysisPrompt(metadata);

      // 调用智谱AI视觉模型，直接使用URL
      const messages = [];
      if (systemPrompt && systemPrompt.trim()) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: imageUrl,
            },
          },
          {
            type: 'text',
            text: userPrompt,
          },
        ],
      });

      const response = await this.zhipuClient.chat.completions.create({
        model: 'glm-4v',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      const analysis = response.choices[0].message.content;
      console.log(`[ImageAnalysis] 分析完成: ${analysis.substring(0, 100)}...`);

      return {
        success: true,
        analysis,
      };
    } catch (error) {
      console.error('[ImageAnalysis] 分析失败:', error);
      return {
        success: false,
        analysis: '',
        error: error.message,
      };
    }
  }

  /**
   * 构建分析提示词
   * @param {Object} metadata - 图片元数据
   * @returns {string}
   */
  async buildAnalysisPrompt(metadata) {
    const templateResult = await this.promptService.getTemplate('image_analysis');
    if (!templateResult.success || !templateResult.data) {
      throw new Error('提示词模板 image_analysis 缺失，请先初始化 prompt_templates 数据。');
    }

    const { title, description, location, category, taken_at } = metadata;
    const template = templateResult.data;
    const replacements = {
      '{location}': location || '',
      '{title}': title || '',
      '{description}': description || '',
      '{category}': category || '',
      '{taken_at}': taken_at || '',
    };

    let userPrompt = template.user_prompt_template;
    for (const [placeholder, value] of Object.entries(replacements)) {
      userPrompt = userPrompt.replaceAll(placeholder, value);
    }

    return {
      systemPrompt: template.system_prompt || '',
      userPrompt,
    };
  }

  /**
   * 批量分析图片（带延迟避免API限流）
   * @param {Array<{imageUrl: string, metadata: Object}>} images - 图片数组
   * @param {Function} onProgress - 进度回调
   * @returns {Promise<Array<{success: boolean, analysis: string, imageUrl: string}>>}
   */
  async analyzeBatch(images, onProgress) {
    const results = [];
    const total = images.length;

    for (let i = 0; i < total; i++) {
      const { imageUrl, metadata } = images[i];

      console.log(`[ImageAnalysis] 批量分析进度: ${i + 1}/${total}`);

      const result = await this.analyzeImage(imageUrl, metadata);
      results.push({
        ...result,
        imageUrl,
      });

      if (onProgress) {
        onProgress(i + 1, total, result);
      }

      // 延迟2秒避免API限流
      if (i < total - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return results;
  }

  /**
   * 生成文本用于向量化
   * @param {Object} photo - 照片数据
   * @param {string} analysis - AI分析结果
   * @returns {string}
   */
  generateVectorText(photo, analysis) {
    const parts = [];

    if (photo.title) {
      parts.push(`作品标题：${photo.title}`);
    }

    if (analysis) {
      parts.push(`画面内容：${analysis}`);
    }

    if (photo.location) {
      parts.push(`拍摄地点：${photo.location}`);
    }

    if (photo.description) {
      parts.push(`作品描述：${photo.description}`);
    }

    if (photo.category) {
      parts.push(`作品分类：${photo.category}`);
    }

    if (photo.taken_at) {
      const date = new Date(photo.taken_at);
      parts.push(`拍摄时间：${date.getFullYear()}年${date.getMonth() + 1}月`);
    }

    return parts.join('\n\n');
  }
}

export default ImageAnalysisService;
