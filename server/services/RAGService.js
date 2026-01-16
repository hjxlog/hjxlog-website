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
  /**
   * 主问答方法 - 使用智能检索策略
   * @param {string} question - 用户问题
   * @param {string} sessionId - 会话ID (可选)
   * @returns {AsyncGenerator<string>} 流式回答
   */
  async *chat(question, sessionId = null) {
    // 1. 问题向量化
    const queryEmbedding = await this.embeddingService.embedText(question);

    // 2. 智能检索（结合相似度梯度和分层检索）
    const documents = await this.smartSearch(queryEmbedding);

    // 3. 构建 Prompt
    const prompt = this.buildPrompt(question, documents);

    // 4. 流式生成回答
    yield* this.llmService.streamChat(prompt);
  }

  /**
   * 智能检索策略 - 组合相似度梯度 + 分层检索
   * @param {number[]} embedding - 查询向量
   * @returns {Promise<Array>} 相关文档
   */
  async smartSearch(embedding) {
    // 第一阶段：广泛检索分析梯度
    const tier1 = await this.searchSimilar(embedding, {
      limit: 30,
      threshold: 0.1,  // 低阈值获取更多候选
    });

    console.log(`[RAG] 第一层检索: ${tier1.length} 个结果`);

    if (tier1.length < 5) {
      // 结果太少，直接返回
      return tier1;
    }

    // 分析类型分布
    const typeDistribution = this.analyzeTypeDistribution(tier1);
    console.log(`[RAG] 类型分布:`, typeDistribution);

    // 计算相似度梯度
    const gradient = this.calculateGradient(tier1);
    console.log(`[RAG] 相似度梯度: ${gradient.toFixed(4)}`);

    // 第二阶段：根据分析结果决定策略
    let finalDocs;

    // 情况1：梯度小（<0.08）→ 很多相关内容 → 需要全面检索
    if (gradient < 0.08) {
      console.log(`[RAG] 策略: 全面检索（梯度小）`);

      if (typeDistribution.photo >= 5) {
        // 照片多，扩展照片检索
        const tier2 = await this.searchSimilar(embedding, {
          limit: 50,
          threshold: 0.1,
          sourceType: 'photo',
        });
        finalDocs = this.mergeAndDedupe(tier1, tier2, 40);
      } else {
        // 其他类型，使用现有结果
        finalDocs = tier1;
      }
    }
    // 情况2：梯度中等（0.08-0.2）→ 有一定相关性 → 适中检索
    else if (gradient < 0.2) {
      console.log(`[RAG] 策略: 适中检索（梯度中）`);

      // 针对照片类型适度扩展
      if (typeDistribution.photo >= 3) {
        const photoDocs = tier1.filter(d => d.source_type === 'photo');
        const otherDocs = tier1.filter(d => d.source_type !== 'photo');

        // 如果照片占比高，扩展照片
        if (photoDocs.length >= typeDistribution.total * 0.6) {
          const tier2 = await this.searchSimilar(embedding, {
            limit: 25,
            threshold: 0.12,
            sourceType: 'photo',
          });
          const mergedPhotos = this.mergeAndDedupe(photoDocs, tier2, 20);
          finalDocs = [...mergedPhotos, ...otherDocs];
        } else {
          finalDocs = tier1;
        }
      } else {
        finalDocs = tier1;
      }
    }
    // 情况3：梯度大（>=0.2）→ 相关性快速下降 → 精准检索
    else {
      console.log(`[RAG] 策略: 精准检索（梯度大）`);

      // 只保留相似度较高的部分
      finalDocs = tier1.filter(d => d.similarity >= tier1[0].similarity - 0.15);

      // 限制数量
      finalDocs = finalDocs.slice(0, 12);
    }

    // 最终去重
    const deduped = this.deduplicateDocuments(finalDocs, 20);
    console.log(`[RAG] 最终返回: ${deduped.length} 个去重后的文档`);

    return deduped;
  }

  /**
   * 计算相似度梯度
   * @param {Array} documents - 检索结果
   * @returns {number} 梯度值（0-1之间）
   */
  calculateGradient(documents) {
    if (documents.length < 10) {
      return 1; // 结果太少，认为梯度大
    }

    // 取前5个和后5个的平均相似度
    const top5 = documents.slice(0, Math.min(5, documents.length))
      .reduce((sum, d) => sum + d.similarity, 0) / Math.min(5, documents.length);

    const bottom5 = documents.slice(Math.max(0, documents.length - 5))
      .reduce((sum, d) => sum + d.similarity, 0) / Math.min(5, documents.length);

    return top5 - bottom5;
  }

  /**
   * 分析类型分布
   * @param {Array} documents - 检索结果
   * @returns {Object} 分布统计
   */
  analyzeTypeDistribution(documents) {
    const distribution = {
      blog: 0,
      work: 0,
      photo: 0,
      total: documents.length,
    };

    documents.forEach(doc => {
      if (distribution[doc.source_type] !== undefined) {
        distribution[doc.source_type]++;
      }
    });

    return distribution;
  }

  /**
   * 合并并去重文档
   * @param {Array} docs1 - 第一组文档
   * @param {Array} docs2 - 第二组文档
   * @param {number} limit - 返回数量限制
   * @returns {Array} 合并去重后的文档
   */
  mergeAndDedupe(docs1, docs2, limit) {
    const merged = [...docs1, ...docs2];
    return this.deduplicateDocuments(merged, limit);
  }

  /**
   * 向量检索
   * @param {number[]} embedding - 查询向量
   * @param {Object} options - 检索选项
   * @returns {Promise<Array>} 相关文档
   */
  async searchSimilar(embedding, options = {}) {
    const { limit = 15, threshold = 0.2, sourceType } = options;

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

    // 获取更多结果，然后去重
    query += ` ORDER BY embedding <=> $1::vector LIMIT $${params.length + 1}`;
    params.push(limit * 2); // 获取双倍数量用于去重

    try {
      const result = await this.db.query(query, params);
      const docs = result.rows;

      // 对照片进行去重：同一张照片只保留最相关的块
      const dedupedDocs = this.deduplicateDocuments(docs, limit);

      console.log(`[RAG] 检索到 ${docs.length} 个块，去重后 ${dedupedDocs.length} 个`);
      return dedupedDocs;
    } catch (error) {
      console.error('Vector search error:', error);
      throw error;
    }
  }

  /**
   * 对文档进行去重和优先级排序
   * 优先级：时间地点块 > 地点时间块 > 主题块
   * @param {Array} documents - 文档列表
   * @param {number} limit - 返回数量限制
   * @returns {Array} 去重后的文档
   */
  deduplicateDocuments(documents, limit) {
    // 按source_id分组
    const grouped = new Map();

    for (const doc of documents) {
      const key = `${doc.source_type}-${doc.source_id}`;

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }

      grouped.get(key).push(doc);
    }

    // 对每组文档进行优先级排序，选择最相关的一个
    const prioritized = [];

    for (const [key, docs] of grouped) {
      // 按优先级排序：time_location > location_time > 其他
      const sorted = docs.sort((a, b) => {
        const priorityA = this.getChunkPriority(a);
        const priorityB = this.getChunkPriority(b);

        if (priorityA !== priorityB) {
          return priorityB - priorityA; // 优先级高的在前
        }

        // 相同优先级按相似度排序
        return b.similarity - a.similarity;
      });

      // 只保留最高优先级的文档
      prioritized.push(sorted[0]);
    }

    // 按相似度排序并限制数量
    return prioritized
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * 获取块的优先级
   * @param {Object} doc - 文档对象
   * @returns {number} 优先级分数（越高越重要）
   */
  getChunkPriority(doc) {
    const chunkType = doc.metadata?.chunk_type || '';

    // 针对时间/地点查询的优先级
    const priorities = {
      'time_location': 3,    // 时间+地点块（回答"某年去哪"最相关）
      'location_time': 2,    // 地点+时间块
      'location': 1,         // 纯地点块
      'time': 1,             // 纯时间块
      'theme': 0,            // 主题块（包含AI分析）
      'overview': 0,
      'content': 0,
    };

    return priorities[chunkType] || 0;
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
