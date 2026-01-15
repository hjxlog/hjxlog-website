/**
 * 知识库管理服务
 * 负责添加、删除、更新知识库内容
 */
import pg from 'pg';
import { ZhipuAI } from 'zhipuai';
import * as textChunker from '../utils/textChunker.js';
import ImageAnalysisService from './ImageAnalysisService.js';

const { Client } = pg;

class KnowledgeBaseService {
  constructor(dbClient) {
    this.db = dbClient;
    this.zhipuClient = new ZhipuAI({
      apiKey: process.env.ZHIPU_API_KEY,
    });
    this.imageAnalysisService = new ImageAnalysisService();
  }

  /**
   * 添加或更新博客到知识库
   * @param {number} blogId - 博客 ID
   * @returns {Promise<{success: boolean, chunks: number, message: string}>}
   */
  async addBlog(blogId) {
    try {
      console.log(`[KnowledgeBase] 添加博客到知识库: ${blogId}`);

      // 1. 获取博客内容
      const blogResult = await this.db.query(
        'SELECT * FROM blogs WHERE id = $1',
        [blogId]
      );

      if (blogResult.rows.length === 0) {
        return { success: false, chunks: 0, message: '博客不存在' };
      }

      const blog = blogResult.rows[0];

      // 2. 删除旧的向量数据
      await this.db.query(
        'DELETE FROM knowledge_base WHERE source_type = $1 AND source_id = $2',
        ['blog', blogId]
      );

      // 3. 分块
      const chunks = textChunker.splitBlog(blog);
      console.log(`[KnowledgeBase] 生成了 ${chunks.length} 个文本块`);

      // 4. 批量向量化
      const batchSize = 10;
      let totalChunks = 0;

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const texts = batch.map(c => c.content);

        const response = await this.zhipuClient.embeddings.create({
          model: 'embedding-2',
          input: texts,
        });

        const embeddings = response.data.map(d => d.embedding);

        // 5. 存入数据库
        for (let j = 0; j < batch.length; j++) {
          const vectorStr = `[${embeddings[j].join(',')}]`;
          await this.db.query(
            `INSERT INTO knowledge_base (source_type, source_id, title, content, metadata, embedding)
             VALUES ($1, $2, $3, $4, $5, $6::vector)`,
            [
              'blog',
              blogId,
              batch[j].title,
              batch[j].content,
              JSON.stringify({
                category: blog.category,
                published: blog.published,
                chunk_index: Math.floor(i / batchSize) * batchSize + j,
                total_chunks: chunks.length,
              }),
              vectorStr,
            ]
          );
          totalChunks++;
        }

        // 批次间延迟
        if (i + batchSize < chunks.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`[KnowledgeBase] 博客添加成功: ${totalChunks} 个文档块`);
      return {
        success: true,
        chunks: totalChunks,
        message: `成功添加 ${totalChunks} 个文档块`,
      };
    } catch (error) {
      console.error('[KnowledgeBase] 添加博客失败:', error);
      return {
        success: false,
        chunks: 0,
        message: error.message,
      };
    }
  }

  /**
   * 添加或更新作品到知识库
   * @param {number} workId - 作品 ID
   * @returns {Promise<{success: boolean, chunks: number, message: string}>}
   */
  async addWork(workId) {
    try {
      console.log(`[KnowledgeBase] 添加作品到知识库: ${workId}`);

      // 1. 获取作品内容
      const workResult = await this.db.query(
        'SELECT * FROM works WHERE id = $1',
        [workId]
      );

      if (workResult.rows.length === 0) {
        return { success: false, chunks: 0, message: '作品不存在' };
      }

      const work = workResult.rows[0];

      // 2. 删除旧的向量数据
      await this.db.query(
        'DELETE FROM knowledge_base WHERE source_type = $1 AND source_id = $2',
        ['work', workId]
      );

      // 3. 分块
      const chunks = textChunker.splitWork(work);
      console.log(`[KnowledgeBase] 生成了 ${chunks.length} 个文本块`);

      // 4. 批量向量化
      const batchSize = 10;
      let totalChunks = 0;

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const texts = batch.map(c => c.content);

        const response = await this.zhipuClient.embeddings.create({
          model: 'embedding-2',
          input: texts,
        });

        const embeddings = response.data.map(d => d.embedding);

        // 5. 存入数据库
        for (let j = 0; j < batch.length; j++) {
          const vectorStr = `[${embeddings[j].join(',')}]`;
          await this.db.query(
            `INSERT INTO knowledge_base (source_type, source_id, title, content, metadata, embedding)
             VALUES ($1, $2, $3, $4, $5, $6::vector)`,
            [
              'work',
              workId,
              batch[j].title,
              batch[j].content,
              JSON.stringify({
                category: work.category,
                status: work.status,
                featured: work.featured,
                chunk_index: Math.floor(i / batchSize) * batchSize + j,
                total_chunks: chunks.length,
              }),
              vectorStr,
            ]
          );
          totalChunks++;
        }

        // 批次间延迟
        if (i + batchSize < chunks.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`[KnowledgeBase] 作品添加成功: ${totalChunks} 个文档块`);
      return {
        success: true,
        chunks: totalChunks,
        message: `成功添加 ${totalChunks} 个文档块`,
      };
    } catch (error) {
      console.error('[KnowledgeBase] 添加作品失败:', error);
      return {
        success: false,
        chunks: 0,
        message: error.message,
      };
    }
  }

  /**
   * 从知识库删除博客
   * @param {number} blogId - 博客 ID
   * @returns {Promise<{success: boolean, deleted: number}>}
   */
  async deleteBlog(blogId) {
    try {
      const result = await this.db.query(
        'DELETE FROM knowledge_base WHERE source_type = $1 AND source_id = $2',
        ['blog', blogId]
      );
      return {
        success: true,
        deleted: result.rowCount || 0,
      };
    } catch (error) {
      console.error('[KnowledgeBase] 删除博客失败:', error);
      return { success: false, deleted: 0 };
    }
  }

  /**
   * 从知识库删除作品
   * @param {number} workId - 作品 ID
   * @returns {Promise<{success: boolean, deleted: number}>}
   */
  async deleteWork(workId) {
    try {
      const result = await this.db.query(
        'DELETE FROM knowledge_base WHERE source_type = $1 AND source_id = $2',
        ['work', workId]
      );
      return {
        success: true,
        deleted: result.rowCount || 0,
      };
    } catch (error) {
      console.error('[KnowledgeBase] 删除作品失败:', error);
      return { success: false, deleted: 0 };
    }
  }

  /**
   * 添加或更新照片到知识库
   * @param {number} photoId - 照片 ID
   * @returns {Promise<{success: boolean, chunks: number, message: string}>}
   */
  async addPhoto(photoId) {
    try {
      console.log(`[KnowledgeBase] 添加照片到知识库: ${photoId}`);

      // 1. 获取照片内容
      const photoResult = await this.db.query(
        'SELECT * FROM photos WHERE id = $1',
        [photoId]
      );

      if (photoResult.rows.length === 0) {
        return { success: false, chunks: 0, message: '照片不存在' };
      }

      const photo = photoResult.rows[0];

      // 2. 删除旧的向量数据
      await this.db.query(
        'DELETE FROM knowledge_base WHERE source_type = $1 AND source_id = $2',
        ['photo', photoId]
      );

      // 3. 使用AI分析图片
      console.log(`[KnowledgeBase] 正在分析图片: ${photo.image_url}`);
      const analysisResult = await this.imageAnalysisService.analyzeImage(
        photo.image_url,
        {
          title: photo.title,
          description: photo.description,
          location: photo.location,
          category: photo.category,
          taken_at: photo.taken_at,
        }
      );

      if (!analysisResult.success) {
        console.error('[KnowledgeBase] 图片分析失败:', analysisResult.error);
        // 即使分析失败，也使用基本信息生成向量
      }

      const analysis = analysisResult.analysis || photo.description || '摄影作品';

      // 4. 生成文本块
      const chunks = textChunker.splitPhoto(photo, analysis);
      console.log(`[KnowledgeBase] 生成了 ${chunks.length} 个文本块`);

      // 5. 向量化
      const texts = chunks.map(c => c.content);
      const response = await this.zhipuClient.embeddings.create({
        model: 'embedding-2',
        input: texts,
      });

      const embeddings = response.data.map(d => d.embedding);

      // 6. 存入数据库
      for (let i = 0; i < chunks.length; i++) {
        const vectorStr = `[${embeddings[i].join(',')}]`;
        await this.db.query(
          `INSERT INTO knowledge_base (source_type, source_id, title, content, metadata, embedding)
           VALUES ($1, $2, $3, $4, $5, $6::vector)`,
          [
            'photo',
            photoId,
            chunks[i].title,
            chunks[i].content,
            JSON.stringify({
              category: photo.category,
              location: photo.location,
              taken_at: photo.taken_at,
              published: photo.published,
              image_url: photo.image_url,
              analysis: analysis,
            }),
            vectorStr,
          ]
        );
      }

      console.log(`[KnowledgeBase] 照片添加成功: ${chunks.length} 个文档块`);
      return {
        success: true,
        chunks: chunks.length,
        message: `成功添加 ${chunks.length} 个文档块`,
      };
    } catch (error) {
      console.error('[KnowledgeBase] 添加照片失败:', error);
      return {
        success: false,
        chunks: 0,
        message: error.message,
      };
    }
  }

  /**
   * 从知识库删除照片
   * @param {number} photoId - 照片 ID
   * @returns {Promise<{success: boolean, deleted: number}>}
   */
  async deletePhoto(photoId) {
    try {
      const result = await this.db.query(
        'DELETE FROM knowledge_base WHERE source_type = $1 AND source_id = $2',
        ['photo', photoId]
      );
      return {
        success: true,
        deleted: result.rowCount || 0,
      };
    } catch (error) {
      console.error('[KnowledgeBase] 删除照片失败:', error);
      return { success: false, deleted: 0 };
    }
  }

  /**
   * 获取知识库内容列表（按源分组）
   * @param {Object} options - 查询选项
   * @returns {Promise<{success: boolean, data: Array, total: number}>}
   */
  async getList(options = {}) {
    const { page = 1, limit = 20, sourceType } = options;

    try {
      let whereClause = '';
      const params = [];
      let paramIndex = 1;

      if (sourceType) {
        whereClause = `WHERE kb.source_type = $${paramIndex++}`;
        params.push(sourceType);
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // 使用 CTE 获取分组数据，并从原始表获取标题
      const query = `
        WITH grouped_data AS (
          SELECT
            source_type,
            source_id,
            MAX(created_at) as created_at,
            COUNT(*) as chunk_count
          FROM knowledge_base kb
          ${whereClause}
          GROUP BY source_type, source_id
          ORDER BY MAX(created_at) DESC
          LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        )
        SELECT
          gd.source_type,
          gd.source_id,
          COALESCE(b.title, w.title, p.title) as title,
          COALESCE(b.category, w.category, p.category) as category,
          gd.created_at,
          gd.chunk_count
        FROM grouped_data gd
        LEFT JOIN blogs b ON gd.source_type = 'blog' AND b.id = gd.source_id
        LEFT JOIN works w ON gd.source_type = 'work' AND w.id = gd.source_id
        LEFT JOIN photos p ON gd.source_type = 'photo' AND p.id = gd.source_id
      `;

      params.push(parseInt(limit), offset);

      console.log('[KnowledgeBase] 列表查询 SQL:', query);
      console.log('[KnowledgeBase] 列表查询参数:', params);

      const result = await this.db.query(query, params);

      console.log('[KnowledgeBase] 列表查询结果行数:', result.rows.length);
      console.log('[KnowledgeBase] 列表查询原始结果:', result.rows);

      // 处理分组数据
      const typeLabels = {
        blog: '博客',
        work: '作品',
        photo: '照片',
      };

      const groupedData = result.rows.map(row => ({
        source_type: row.source_type,
        source_id: row.source_id,
        title: row.title || `未命名${typeLabels[row.source_type] || '文档'}`,
        source_title: row.title || `未命名${typeLabels[row.source_type] || '文档'}`,
        category: row.category || '',
        chunk_count: parseInt(row.chunk_count),
        created_at: row.created_at,
      }));

      console.log('[KnowledgeBase] 处理后的数据:', groupedData);

      // 获取总数
      const countResult = await this.db.query(
        `SELECT COUNT(DISTINCT CONCAT(source_type, '-', source_id)) as total FROM knowledge_base ${whereClause}`,
        params.slice(0, sourceType ? 1 : 0)
      );
      const total = parseInt(countResult.rows[0].total);

      console.log('[KnowledgeBase] 总数:', total);

      return {
        success: true,
        data: groupedData,
        total,
      };
    } catch (error) {
      console.error('[KnowledgeBase] 获取列表失败 - 详细错误:', error);
      console.error('[KnowledgeBase] 错误堆栈:', error.stack);
      return {
        success: false,
        data: [],
        total: 0,
      };
    }
  }

  /**
   * 获取某个源的所有 chunk 详情
   * @param {string} sourceType - 源类型
   * @param {number} sourceId - 源 ID
   * @returns {Promise<{success: boolean, data: Array}>}
   */
  async getChunks(sourceType, sourceId) {
    try {
      const result = await this.db.query(
        `SELECT
          id,
          title,
          content,
          metadata,
          created_at
        FROM knowledge_base
        WHERE source_type = $1 AND source_id = $2
        ORDER BY created_at ASC`,
        [sourceType, sourceId]
      );

      return {
        success: true,
        data: result.rows,
      };
    } catch (error) {
      console.error('[KnowledgeBase] 获取 chunks 失败:', error);
      return {
        success: false,
        data: [],
      };
    }
  }

  /**
   * 重建整个知识库
   * @param {Object} options - 选项
   * @returns {Promise<{success: boolean, stats: Object}>}
   */
  async rebuildAll(options = {}) {
    const { blogs = true, works = true, photos = true } = options;

    try {
      console.log('[KnowledgeBase] 开始重建知识库...');

      // 清空现有数据
      await this.db.query('DELETE FROM knowledge_base');
      console.log('[KnowledgeBase] 已清空现有数据');

      let totalBlogs = 0;
      let totalWorks = 0;
      let totalPhotos = 0;
      let totalChunks = 0;

      // 处理博客
      if (blogs) {
        const blogsResult = await this.db.query(
          'SELECT id FROM blogs WHERE published = true'
        );

        for (const row of blogsResult.rows) {
          const result = await this.addBlog(row.id);
          if (result.success) {
            totalBlogs++;
            totalChunks += result.chunks;
          }
        }

        console.log(`[KnowledgeBase] 处理了 ${totalBlogs} 篇博客`);
      }

      // 处理作品
      if (works) {
        const worksResult = await this.db.query('SELECT id FROM works');

        for (const row of worksResult.rows) {
          const result = await this.addWork(row.id);
          if (result.success) {
            totalWorks++;
            totalChunks += result.chunks;
          }
        }

        console.log(`[KnowledgeBase] 处理了 ${totalWorks} 个作品`);
      }

      // 处理照片
      if (photos) {
        const photosResult = await this.db.query(
          'SELECT id FROM photos WHERE published = true'
        );

        for (const row of photosResult.rows) {
          const result = await this.addPhoto(row.id);
          if (result.success) {
            totalPhotos++;
            totalChunks += result.chunks;
          }
          // 照片处理需要较慢，延迟2秒
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log(`[KnowledgeBase] 处理了 ${totalPhotos} 张照片`);
      }

      // 更新最后更新时间
      await this.db.query(`
        INSERT INTO chat_global_usage (request_date, total_requests)
        VALUES (CURRENT_DATE, 0)
        ON CONFLICT (request_date) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
      `);

      return {
        success: true,
        stats: {
          totalBlogs,
          totalWorks,
          totalPhotos,
          totalChunks,
        },
      };
    } catch (error) {
      console.error('[KnowledgeBase] 重建失败:', error);
      return {
        success: false,
        stats: {
          totalBlogs: 0,
          totalWorks: 0,
          totalPhotos: 0,
          totalChunks: 0,
        },
      };
    }
  }
}

export default KnowledgeBaseService;
