/**
 * 文本分块工具
 * 用于将长文本分割成适合向量化的块
 */

/**
 * 文本分块配置
 */
const CHUNK_CONFIG = {
  maxChunkSize: 500,    // 每块最大字数
  chunkOverlap: 50,     // 块之间重叠字数
  minChunkSize: 100,    // 最小块大小
};

/**
 * 将文本分块（带安全保护）
 * @param {string} text - 原始文本
 * @returns {string[]} 文本块数组
 */
function splitText(text) {
  if (!text || text.trim().length === 0) {
    console.log('    [分块] 空文本，跳过');
    return [];
  }

  console.log(`    [分块] 原始文本长度: ${text.length} 字符`);

  // 清理文本
  const cleanText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  console.log(`    [分块] 清理后长度: ${cleanText.length} 字符`);

  const chunks = [];
  let currentIndex = 0;
  let iterations = 0;
  const maxIterations = 10000; // 防止死循环

  while (currentIndex < cleanText.length) {
    iterations++;

    // 安全检查
    if (iterations > maxIterations) {
      console.error(`    [分块] 超过最大迭代次数! current=${currentIndex}, total=${cleanText.length}`);
      break;
    }

    // 计算当前块的结束位置
    let endIndex = currentIndex + CHUNK_CONFIG.maxChunkSize;

    // 如果不是最后一块，尝试在最近的句号、换行符处断开
    if (endIndex < cleanText.length) {
      // 优先在段落边界断开
      const paragraphBreak = cleanText.lastIndexOf('\n\n', endIndex);
      if (paragraphBreak > currentIndex + CHUNK_CONFIG.minChunkSize) {
        endIndex = paragraphBreak + 2;
      } else {
        // 其次在句子边界断开
        const sentenceBreak = cleanText.lastIndexOf('。', endIndex);
        if (sentenceBreak > currentIndex + CHUNK_CONFIG.minChunkSize) {
          endIndex = sentenceBreak + 1;
        }
      }
    } else {
      endIndex = cleanText.length;
    }

    const chunk = cleanText.substring(currentIndex, endIndex).trim();
    if (chunk.length >= CHUNK_CONFIG.minChunkSize) {
      chunks.push(chunk);
    }

    // 移动到下一块（带重叠）
    const nextIndex = endIndex - CHUNK_CONFIG.chunkOverlap;

    // 确保索引前进
    if (nextIndex <= currentIndex) {
      console.warn(`    [分块] 索引未前进，强制前进: ${currentIndex} -> ${endIndex}`);
      currentIndex = endIndex;
    } else {
      currentIndex = nextIndex;
    }

    // 如果到了末尾，退出
    if (currentIndex >= cleanText.length - CHUNK_CONFIG.minChunkSize) {
      break;
    }
  }

  console.log(`    [分块] 完成: ${chunks.length} 个块, ${iterations} 次迭代`);
  return chunks;
}

/**
 * 处理博客内容，提取标题和正文
 * @param {Object} blog - 博客对象
 * @returns {Array<{title: string, content: string}>}
 */
function splitBlog(blog) {
  const chunks = splitText(blog.content);
  return chunks.map((chunk, index) => ({
    title: `${blog.title} (第 ${index + 1} 部分)`,
    content: chunk,
  }));
}

/**
 * 处理作品内容
 * @param {Object} work - 作品对象
 * @returns {Array<{title: string, content: string}>}
 */
function splitWork(work) {
  // 组合作品的各个字段
  const fullText = [
    work.title,
    work.description,
    work.technologies,
    work.features,
  ].filter(Boolean).join('\n\n');

  const chunks = splitText(fullText);
  return chunks.map((chunk, index) => ({
    title: `${work.title} - ${work.category || '作品'} (第 ${index + 1} 部分)`,
    content: chunk,
  }));
}

/**
 * 处理摄影作品
 * @param {Object} photo - 照片对象
 * @param {string} analysis - AI分析结果
 * @returns {Array<{title: string, content: string}>}
 */
function splitPhoto(photo, analysis) {
  // 生成向量化文本
  const text = [
    `作品标题：${photo.title}`,
    `画面内容分析：${analysis}`,
  ];

  if (photo.location) {
    text.push(`拍摄地点：${photo.location}`);
  }

  if (photo.description) {
    text.push(`作品描述：${photo.description}`);
  }

  if (photo.category) {
    text.push(`作品分类：${photo.category}`);
  }

  if (photo.taken_at) {
    const date = new Date(photo.taken_at);
    text.push(`拍摄时间：${date.getFullYear()}年${date.getMonth() + 1}月`);
  }

  const fullText = text.join('\n\n');

  // 摄影作品通常不需要分块，直接作为一个整体
  return [{
    title: photo.title,
    content: fullText,
  }];
}

export { CHUNK_CONFIG, splitText, splitBlog, splitWork, splitPhoto };
