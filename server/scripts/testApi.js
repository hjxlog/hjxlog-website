/**
 * 智谱 API 连接测试脚本
 */
import { config } from 'dotenv';
import { ZhipuAI } from 'zhipuai';

config();

async function testAPI() {
  console.log('开始测试智谱 API...');
  console.log('API Key:', process.env.ZHIPU_API_KEY?.substring(0, 15) + '...');

  const client = new ZhipuAI({
    apiKey: process.env.ZHIPU_API_KEY,
  });

  // 测试 1: 简单的嵌入请求
  console.log('\n测试 1: 单个文本嵌入...');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await client.embeddings.create({
      model: 'embedding-2',
      input: '测试文本',
    });

    clearTimeout(timeoutId);
    console.log('✓ 成功! 向量维度:', response.data[0].embedding.length);
  } catch (error) {
    console.error('✗ 失败:', error.message);
    console.error('错误详情:', error);
    process.exit(1);
  }

  // 测试 2: 批量嵌入
  console.log('\n测试 2: 批量文本嵌入...');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await client.embeddings.create({
      model: 'embedding-2',
      input: ['测试1', '测试2', '测试3'],
    });

    clearTimeout(timeoutId);
    console.log('✓ 成功! 返回向量数:', response.data.length);
  } catch (error) {
    console.error('✗ 失败:', error.message);
    console.error('错误详情:', error);
  }

  // 测试 3: Chat 接口
  console.log('\n测试 3: Chat 接口...');
  try {
    const response = await client.chat.completions.create({
      model: 'glm-4-flash',
      messages: [{ role: 'user', content: '你好' }],
      stream: false,
    });
    console.log('✓ 成功! 回复:', response.choices[0].message.content);
  } catch (error) {
    console.error('✗ 失败:', error.message);
  }

  console.log('\n测试完成!');
}

testAPI().catch(console.error);
