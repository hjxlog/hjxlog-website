/**
 * RAG (检索增强生成) 核心服务
 * 负责向量检索和 Prompt 构建
 */
import EmbeddingService from './EmbeddingService.js';
import LLMService from './LLMService.js';

/**
 * 系统提示词
 */
const SYSTEM_PROMPT = `你是一个AI助手，帮助访客了解这个人的信息。

规则：
- 只基于以下参考信息回答，不要编造内容
- 如果参考信息不足以回答问题，如实说明
- 回答简洁友好，适当使用emoji增加亲和力
- 突出技术能力和项目经验`;

class RAGService {
  constructor(dbClient) {
    this.db = dbClient;
    this.embeddingService = new EmbeddingService();
    this.llmService = new LLMService();
  }

  /**
   * 主问答方法
   * @param {string} question - 用户问题
   * @param {string} sessionId - 会话ID (可选)
   * @returns {AsyncGenerator<string>} 流式回答
   */
  async *chat(question, sessionId = null) {
    // 1. 问题向量化
    const queryEmbedding = await this.embeddingService.embedText(question);

    // 2. 检索相关文档
    const documents = await this.searchSimilar(queryEmbedding, {
      limit: 5,
      threshold: 0.3,
    });

    // 3. 构建 Prompt
    const prompt = this.buildPrompt(question, documents);

    // 4. 流式生成回答
    yield* this.llmService.streamChat(prompt);
  }

  /**
   * 向量检索
   * @param {number[]} embedding - 查询向量
   * @param {Object} options - 检索选项
   * @returns {Promise<Array>} 相关文档
   */
  async searchSimilar(embedding, options = {}) {
    const { limit = 5, threshold = 0.3, sourceType } = options;

    // 将数组转换为 PGVector 格式
    const vectorStr = `[${embedding.join(',')}]`;

    let query = `
      SELECT id, title, content, metadata, source_type, source_id,
             1 - (embedding <=> $1::vector) as similarity
      FROM knowledge_base
      WHERE 1 - (embedding <=> $1::vector) > $2
    `;
    const params = [vectorStr, threshold];

    if (sourceType) {
      query += ` AND source_type = $${params.length + 1}`;
      params.push(sourceType);
    }

    query += ` ORDER BY embedding <=> $1::vector LIMIT $${params.length + 1}`;
    params.push(limit);

    try {
      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Vector search error:', error);
      throw error;
    }
  }

  /**
   * 构建提示词
   * @param {string} question - 用户问题
   * @param {Array} documents - 检索到的文档
   * @returns {Object} 提示对象
   */
  buildPrompt(question, documents) {
    if (documents.length === 0) {
      return {
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `用户问题：${question}\n\n注意：知识库中没有找到相关信息。`,
        }],
      };
    }

    const contextStr = documents
      .map((doc, i) => `[来源${i + 1}] ${doc.title}\n${doc.content}`)
      .join('\n\n');

    return {
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `参考信息：\n\n${contextStr}\n\n用户问题：${question}`,
      }],
    };
  }

  /**
   * 获取知识库统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getStats() {
    const result = await this.db.query(`
      SELECT
        source_type,
        COUNT(*) as count
      FROM knowledge_base
      GROUP BY source_type
    `);

    const stats = {
      total: 0,
      by_source: {},
      last_updated: null,
    };

    for (const row of result.rows) {
      stats.by_source[row.source_type] = parseInt(row.count);
      stats.total += parseInt(row.count);
    }

    // 获取最后更新时间
    const lastUpdate = await this.db.query(`
      SELECT MAX(updated_at) as last_updated
      FROM knowledge_base
    `);
    stats.last_updated = lastUpdate.rows[0].last_updated;

    return stats;
  }
}

export default RAGService;
