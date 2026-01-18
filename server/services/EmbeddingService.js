/**
 * 智谱 AI 嵌入服务
 * 负责将文本转换为向量
 */
import { ZhipuAI } from 'zhipuai';

class EmbeddingService {
  constructor(apiKey) {
    this.client = new ZhipuAI({
      apiKey: apiKey || process.env.ZHIPU_API_KEY,
    });
    this.model = 'embedding-2';  // 智谱嵌入模型
    this.dimension = 1024;       // 向量维度
    this.timeout = 60000;        // 60秒超时
  }

  /**
   * 单个文本向量化
   * @param {string} text - 输入文本
   * @returns {Promise<number[]>} 向量数组
   */
  async embedText(text) {
    try {
      console.log(`    [Embedding] 向量化文本 (${text.length} 字符)...`);
      const startTime = Date.now();

      const response = await Promise.race([
        this.client.embeddings.create({
          model: this.model,
          input: text,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('向量化请求超时 (60s)')), this.timeout)
        ),
      ]);

      const elapsed = Date.now() - startTime;
      console.log(`    [Embedding] 完成 (${elapsed}ms)`);

      return response.data[0].embedding;
    } catch (error) {
      console.error('    [Embedding] 错误:', error.message);
      if (error.status) {
        console.error(`    [Embedding] API 状态码: ${error.status}`);
        console.error(`    [Embedding] API 响应: ${JSON.stringify(error.response?.data)}`);
      }
      throw new Error(`Failed to embed text: ${error.message}`);
    }
  }

  /**
   * 批量文本向量化
   * @param {string[]} texts - 文本数组
   * @returns {Promise<number[][]>} 向量数组
   */
  async embedBatch(texts) {
    const results = [];
    const batchSize = 20; // 智谱 API 限制

    console.log(`    [Embedding] 批量向量化 ${texts.length} 个文本块`);

    for (let i = 0; i < texts.length; i += batchSize) {
      const batchIndex = Math.floor(i / batchSize);
      const batch = texts.slice(i, i + batchSize);

      try {
        console.log(`    [Embedding] 处理批次 ${batchIndex + 1} (${batch.length} 个文本)...`);

        const response = await Promise.race([
          this.client.embeddings.create({
            model: this.model,
            input: batch,
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('批量向量化请求超时 (60s)')), this.timeout)
          ),
        ]);

        const embeddings = response.data.map(d => d.embedding);
        results.push(...embeddings);

        console.log(`    [Embedding] 批次 ${batchIndex + 1} 完成`);
      } catch (error) {
        console.error(`    [Embedding] 批次 ${batchIndex + 1} 失败:`, error.message);
        if (error.status) {
          console.error(`    [Embedding] API 状态码: ${error.status}`);
          console.error(`    [Embedding] API 响应: ${JSON.stringify(error.response?.data)}`);
        }
        throw error;
      }
    }

    console.log(`    [Embedding] 批量向量化完成，共 ${results.length} 个向量`);
    return results;
  }

  /**
   * 处理博客内容：分块并向量化
   * @param {Object} blog - 博客对象
   * @param {Object} chunker - 分块工具
   * @returns {Promise<Array>}
   */
  async processBlog(blog, chunker) {
    console.log(`    [ProcessBlog] 分块: ${blog.title}`);
    const chunks = chunker.splitBlog(blog);
    console.log(`    [ProcessBlog] 生成 ${chunks.length} 个文本块`);

    const texts = chunks.map(c => c.content);
    const embeddings = await this.embedBatch(texts);

    return chunks.map((chunk, index) => ({
      source_type: 'blog',
      source_id: blog.id,
      title: chunk.title,
      content: chunk.content,
      metadata: {
        category: blog.category,
        published: blog.published,
        chunk_index: index,
        total_chunks: chunks.length,
      },
      embedding: embeddings[index],
    }));
  }

  /**
   * 处理作品内容：分块并向量化
   * @param {Object} work - 作品对象
   * @param {Object} chunker - 分块工具
   * @returns {Promise<Array>}
   */
  async processWork(work, chunker) {
    console.log(`    [ProcessWork] 分块: ${work.title}`);
    const chunks = chunker.splitWork(work);
    console.log(`    [ProcessWork] 生成 ${chunks.length} 个文本块`);

    const texts = chunks.map(c => c.content);
    const embeddings = await this.embedBatch(texts);

    return chunks.map((chunk, index) => ({
      source_type: 'work',
      source_id: work.id,
      title: chunk.title,
      content: chunk.content,
      metadata: {
        category: work.category,
        status: work.status,
        featured: work.featured,
        chunk_index: index,
        total_chunks: chunks.length,
      },
      embedding: embeddings[index],
    }));
  }
}

export default EmbeddingService;
