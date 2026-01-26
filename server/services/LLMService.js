/**
 * 智谱 AI LLM 服务
 * 负责生成回答
 */
import { ZhipuAI } from 'zhipuai';

class LLMService {
  constructor(apiKey) {
    this.client = new ZhipuAI({
      apiKey: apiKey || process.env.ZHIPU_API_KEY,
    });
    this.model = 'glm-4-flash';  // 使用更快的 flash 模型
  }

  /**
   * 流式对话
   * @param {Object} prompt - 提示对象 { system, messages }
   * @returns {AsyncGenerator<string>} 流式输出
   */
  async *streamChat(prompt) {
    try {
      const messages = [];
      if (prompt.system && prompt.system.trim()) {
        messages.push({ role: 'system', content: prompt.system });
      }
      messages.push(...prompt.messages);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
        stream: true,
      });

      for await (const chunk of response) {
        if (chunk.choices[0]?.delta?.content) {
          yield chunk.choices[0].delta.content;
        }
      }
    } catch (error) {
      console.error('LLM streaming error:', error);
      throw new Error(`LLM error: ${error.message}`);
    }
  }

  /**
   * 非流式对话
   * @param {Object} prompt - 提示对象
   * @returns {Promise<string>} 完整回答
   */
  async chat(prompt) {
    try {
      const messages = [];
      if (prompt.system && prompt.system.trim()) {
        messages.push({ role: 'system', content: prompt.system });
      }
      messages.push(...prompt.messages);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
        stream: false,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('LLM error:', error);
      throw new Error(`LLM error: ${error.message}`);
    }
  }
}

export default LLMService;
