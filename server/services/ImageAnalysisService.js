/**
 * 图片分析服务
 * 使用智谱AI视觉模型分析图片内容，提取地点、场景等信息
 */
import { ZhipuAI } from 'zhipuai';

class ImageAnalysisService {
  constructor() {
    this.zhipuClient = new ZhipuAI({
      apiKey: process.env.ZHIPU_API_KEY,
    });
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
      const prompt = this.buildAnalysisPrompt(metadata);

      // 调用智谱AI视觉模型，直接使用URL
      const response = await this.zhipuClient.chat.completions.create({
        model: 'glm-4v',
        messages: [
          {
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
                text: prompt,
              },
            ],
          },
        ],
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
  buildAnalysisPrompt(metadata) {
    const { title, description, location, category, taken_at } = metadata;

    let prompt = '你是一个专业的摄影作品分析师。请仔细观察这张图片，提取关键信息用于后续的智能检索。\n\n';

    prompt += '**重点要求**：\n';
    prompt += '1. 如果能识别出具体的地理位置（城市、景点、地标），请明确指出，这是最重要的信息\n';
    prompt += '2. 描述画面的主要场景和内容\n';
    prompt += '3. 提取关键元素和特征\n\n';

    prompt += '请按以下格式回答（简洁明了，200字以内）：\n\n';
    prompt += '**拍摄地点**：如果能识别，请给出具体位置（如"日本京都清水寺"、"中国上海外滩"等）\n';
    prompt += '**场景类型**：自然风光、城市建筑、人像、街拍、夜景等\n';
    prompt += '**画面内容**：主要物体、人物、建筑、景色等\n';
    prompt += '**视觉特征**：颜色、光影、构图等\n';

    if (location) {
      prompt += `\n[已知拍摄地点：${location}，请结合图片内容确认或补充]`;
    }

    if (title) {
      prompt += `\n作品标题：${title}`;
    }

    if (description) {
      prompt += `\n作品描述：${description}`;
    }

    if (category) {
      prompt += `\n作品分类：${category}`;
    }

    if (taken_at) {
      prompt += `\n拍摄时间：${taken_at}`;
    }

    return prompt;
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
