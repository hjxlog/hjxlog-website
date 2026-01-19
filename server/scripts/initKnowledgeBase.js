/**
 * 知识库初始化脚本（带重试和延迟）
 */
import pg from 'pg';
import { config } from 'dotenv';
import { ZhipuAI } from 'zhipuai';
import * as textChunker from '../utils/textChunker.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, '../../.env') });

const { Client } = pg;

// 延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 带重试的向量化函数
async function embedWithRetry(client, texts, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`      [批次 ${attempt}] 调用 API...`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30秒超时

      const response = await client.embeddings.create({
        model: 'embedding-2',
        input: texts,
      });

      clearTimeout(timeout);
      console.log(`      [批次 ${attempt}] ✓ 成功 (${response.data.length} 个向量)`);

      return response.data.map(d => d.embedding);
    } catch (error) {
      console.error(`      [批次 ${attempt}] ✗ 失败: ${error.message}`);

      if (attempt === maxRetries) {
        throw new Error(`API 调用失败，已重试 ${maxRetries} 次: ${error.message}`);
      }

      // 指数退避延迟
      const waitTime = attempt * 2000;
      console.log(`      [批次 ${attempt}] 等待 ${waitTime}ms 后重试...`);
      await delay(waitTime);
    }
  }
}

async function initKnowledgeBase() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('✓ 数据库连接成功');

    if (!process.env.ZHIPU_API_KEY) {
      throw new Error('ZHIPU_API_KEY 未设置');
    }
    console.log('✓ API Key 已配置');

    // 清空现有数据
    console.log('\n清理现有知识库...');
    await client.query('DELETE FROM knowledge_base');
    console.log('✓ 已清空');

    const zhipuClient = new ZhipuAI({
      apiKey: process.env.ZHIPU_API_KEY,
    });

    let totalDocuments = 0;

    // 1. 处理博客
    console.log('\n处理博客...');
    const blogsResult = await client.query(
      'SELECT * FROM blogs WHERE published = true'
    );
    console.log(`找到 ${blogsResult.rows.length} 篇博客`);

    for (let i = 0; i < blogsResult.rows.length; i++) {
      const blog = blogsResult.rows[i];
      console.log(`\n[${i + 1}/${blogsResult.rows.length}] ${blog.title}`);

      try {
        // 分块
        const chunks = textChunker.splitBlog(blog);
        console.log(`  分块: ${chunks.length} 个`);

        // 批量向量化（每批最多 10 个，避免超时）
        const batchSize = 10;
        let allEmbeddings = [];

        for (let j = 0; j < chunks.length; j += batchSize) {
          const batch = chunks.slice(j, j + batchSize);
          const batchNum = Math.floor(j / batchSize) + 1;
          const totalBatches = Math.ceil(chunks.length / batchSize);

          console.log(`  批次 ${batchNum}/${totalBatches}: ${batch.length} 个文本块`);

          const texts = batch.map(c => c.content);
          const embeddings = await embedWithRetry(zhipuClient, texts);
          allEmbeddings.push(...embeddings);

          // 批次间延迟，避免限流
          if (j + batchSize < chunks.length) {
            await delay(1000);
          }
        }

        // 存入数据库
        for (let k = 0; k < chunks.length; k++) {
          const vectorStr = `[${allEmbeddings[k].join(',')}]`;
          await client.query(
            `INSERT INTO knowledge_base (source_type, source_id, title, content, metadata, embedding)
             VALUES ($1, $2, $3, $4, $5, $6::vector)`,
            [
              'blog',
              blog.id,
              chunks[k].title,
              chunks[k].content,
              JSON.stringify({
                category: blog.category,
                published: blog.published,
                chunk_index: k,
                total_chunks: chunks.length,
              }),
              vectorStr,
            ]
          );
          totalDocuments++;
        }

        console.log(`  ✓ 完成 (共 ${chunks.length} 个文档)`);

        // 博客间延迟
        if (i < blogsResult.rows.length - 1) {
          await delay(2000);
        }

      } catch (error) {
        console.error(`  ✗ 处理失败: ${error.message}`);
        // 继续处理下一篇
      }
    }

    // 2. 处理作品
    console.log('\n处理作品...');
    const worksResult = await client.query('SELECT * FROM works');
    console.log(`找到 ${worksResult.rows.length} 个作品`);

    for (let i = 0; i < worksResult.rows.length; i++) {
      const work = worksResult.rows[i];
      console.log(`\n[${i + 1}/${worksResult.rows.length}] ${work.title}`);

      try {
        const chunks = textChunker.splitWork(work);
        console.log(`  分块: ${chunks.length} 个`);

        const batchSize = 10;
        let allEmbeddings = [];

        for (let j = 0; j < chunks.length; j += batchSize) {
          const batch = chunks.slice(j, j + batchSize);
          const batchNum = Math.floor(j / batchSize) + 1;
          const totalBatches = Math.ceil(chunks.length / batchSize);

          console.log(`  批次 ${batchNum}/${totalBatches}: ${batch.length} 个文本块`);

          const texts = batch.map(c => c.content);
          const embeddings = await embedWithRetry(zhipuClient, texts);
          allEmbeddings.push(...embeddings);

          if (j + batchSize < chunks.length) {
            await delay(1000);
          }
        }

        for (let k = 0; k < chunks.length; k++) {
          const vectorStr = `[${allEmbeddings[k].join(',')}]`;
          await client.query(
            `INSERT INTO knowledge_base (source_type, source_id, title, content, metadata, embedding)
             VALUES ($1, $2, $3, $4, $5, $6::vector)`,
            [
              'work',
              work.id,
              chunks[k].title,
              chunks[k].content,
              JSON.stringify({
                category: work.category,
                status: work.status,
                featured: work.featured,
                chunk_index: k,
                total_chunks: chunks.length,
              }),
              vectorStr,
            ]
          );
          totalDocuments++;
        }

        console.log(`  ✓ 完成 (共 ${chunks.length} 个文档)`);

        if (i < worksResult.rows.length - 1) {
          await delay(2000);
        }

      } catch (error) {
        console.error(`  ✗ 处理失败: ${error.message}`);
      }
    }

    console.log(`\n✓ 知识库初始化完成！共 ${totalDocuments} 个文档`);

  } catch (error) {
    console.error('\n❌ 初始化失败:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✓ 数据库连接已关闭');
  }
}

initKnowledgeBase();
