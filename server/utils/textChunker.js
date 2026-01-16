/**
 * 文本分块工具 - 方案 A：语义结构化分块
 * 针对不同类型内容使用不同的分块策略
 */

/**
 * 基础分块配置
 */
const CHUNK_CONFIG = {
  blog: {
    maxSize: 1000,      // 博客内容较长
    overlap: 150,       // 更多重叠保持上下文
    minSize: 200,
  },
  work: {
    maxSize: 800,       // 作品描述中等
    overlap: 100,
    minSize: 150,
  },
  photo: {
    maxSize: 2000,      // 照片不分块
    overlap: 0,
    minSize: 0,
  }
};

/**
 * 将文本分块（通用方法）
 * @param {string} text - 原始文本
 * @param {Object} config - 分块配置
 * @returns {string[]} 文本块数组
 */
function splitText(text, config = CHUNK_CONFIG.blog) {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const cleanText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (cleanText.length <= config.maxSize) {
    return [cleanText];
  }

  const chunks = [];
  let currentIndex = 0;
  const maxIterations = 10000;

  while (currentIndex < cleanText.length) {
    let endIndex = currentIndex + config.maxSize;

    // 智能边界断开
    if (endIndex < cleanText.length) {
      // 优先在段落边界断开
      const paragraphBreak = cleanText.lastIndexOf('\n\n', endIndex);
      if (paragraphBreak > currentIndex + config.minSize) {
        endIndex = paragraphBreak + 2;
      } else {
        // 其次在句子边界断开
        const sentenceBreak = cleanText.lastIndexOf('。', endIndex);
        if (sentenceBreak > currentIndex + config.minSize) {
          endIndex = sentenceBreak + 1;
        }
      }
    } else {
      endIndex = cleanText.length;
    }

    const chunk = cleanText.substring(currentIndex, endIndex).trim();
    if (chunk.length >= config.minSize) {
      chunks.push(chunk);
    }

    // 滑动窗口（带重叠）
    const nextIndex = endIndex - config.overlap;
    currentIndex = nextIndex > currentIndex ? nextIndex : endIndex;

    if (currentIndex >= cleanText.length - config.minSize) {
      break;
    }
  }

  return chunks;
}

/**
 * 博客结构化分块 - 方案A
 * 生成3类向量块：概览块、内容块、标签块
 * @param {Object} blog - 博客对象
 * @returns {Array<{title: string, content: string, metadata: Object}>}
 */
function splitBlog(blog) {
  const chunks = [];
  const baseMetadata = {
    source_type: 'blog',
    source_id: blog.id,
    title: blog.title,
    category: blog.category,
    published: blog.published,
    featured: blog.featured || false,
    created_at: blog.created_at,
    searchable_text: `${blog.title} ${blog.category} ${(blog.tags || []).join(' ')}`,
    weight: (blog.featured ? 2.0 : 1.0) * (1 + (blog.views || 0) / 1000 + (blog.likes || 0) / 100),
  };

  // 1. 概览块（1个）- 标题 + 摘要 + 分类 + 标签
  const overviewContent = [
    `文章标题：${blog.title}`,
    `文章分类：${blog.category}`,
  ];

  if (blog.excerpt) {
    overviewContent.push(`文章摘要：${blog.excerpt}`);
  }

  if (blog.tags && blog.tags.length > 0) {
    overviewContent.push(`文章标签：${blog.tags.join('、')}`);
  }

  if (blog.featured) {
    overviewContent.push('（精选文章）');
  }

  chunks.push({
    title: blog.title,
    content: overviewContent.join('\n\n'),
    metadata: {
      ...baseMetadata,
      chunk_type: 'overview',
      chunk_index: 0,
    },
  });

  // 2. 内容块（N个）- 正文内容
  const contentChunks = splitText(blog.content, CHUNK_CONFIG.blog);
  contentChunks.forEach((chunk, index) => {
    chunks.push({
      title: `${blog.title} (第 ${index + 1} 部分)`,
      content: chunk,
      metadata: {
        ...baseMetadata,
        chunk_type: 'content',
        chunk_index: index,
        total_chunks: contentChunks.length,
      },
    });
  });

  // 3. 标签块（M个）- 每个标签独立
  if (blog.tags && blog.tags.length > 0) {
    blog.tags.forEach((tag, index) => {
      chunks.push({
        title: `标签：${tag}`,
        content: `文章《${blog.title}》包含标签"${tag}"，属于${blog.category}分类。${blog.excerpt || ''}`,
        metadata: {
          ...baseMetadata,
          chunk_type: 'tag',
          tag_name: tag,
          chunk_index: index,
        },
      });
    });
  }

  console.log(`[博客分块] ${blog.title}: 概览1 + 内容${contentChunks.length} + 标签${blog.tags?.length || 0} = ${chunks.length}个块`);
  return chunks;
}

/**
 * 作品技术栈导向分块 - 方案A
 * 生成4类向量块：技术栈块、功能亮点块、挑战块、综合描述块
 * @param {Object} work - 作品对象
 * @returns {Array<{title: string, content: string, metadata: Object}>}
 */
function splitWork(work) {
  const chunks = [];
  const baseMetadata = {
    source_type: 'work',
    source_id: work.id,
    title: work.title,
    category: work.category,
    status: work.status,
    created_at: work.created_at,
    searchable_text: `${work.title} ${work.category} ${(work.technologies || []).join(' ')} ${(work.tags || []).join(' ')}`,
    weight: work.featured ? 2.0 : 1.0,
  };

  // 1. 综合描述块（1个）
  const descContent = [
    `作品名称：${work.title}`,
    `作品分类：${work.category}`,
    `项目状态：${work.status === 'completed' ? '已完成' : work.status === 'active' ? '进行中' : '计划中'}`,
  ];

  if (work.description) {
    descContent.push(`作品描述：${work.description}`);
  }

  if (work.tags && work.tags.length > 0) {
    descContent.push(`作品标签：${work.tags.join('、')}`);
  }

  chunks.push({
    title: work.title,
    content: descContent.join('\n\n'),
    metadata: {
      ...baseMetadata,
      chunk_type: 'overview',
      chunk_index: 0,
    },
  });

  // 2. 技术栈块（每个技术1个）
  if (work.technologies && work.technologies.length > 0) {
    work.technologies.forEach((tech, index) => {
      chunks.push({
        title: `技术栈：${tech}`,
        content: `作品《${work.title}》使用了${tech}技术栈。${work.description || ''}`,
        metadata: {
          ...baseMetadata,
          chunk_type: 'technology',
          tech_name: tech,
          chunk_index: index,
        },
      });
    });
  }

  // 3. 功能亮点块（每个feature 1个）
  if (work.features && work.features.length > 0) {
    work.features.forEach((feature, index) => {
      chunks.push({
        title: `功能：${feature.substring(0, 30)}...`,
        content: `作品《${work.title}》实现了功能：${feature}`,
        metadata: {
          ...baseMetadata,
          chunk_type: 'feature',
          feature_name: feature,
          chunk_index: index,
        },
      });
    });
  }

  // 4. 挑战与解决块（每个challenge 1个）
  if (work.challenges && work.challenges.length > 0) {
    work.challenges.forEach((challenge, index) => {
      chunks.push({
        title: `技术挑战：${challenge.substring(0, 30)}...`,
        content: `作品《${work.title}》解决的技术挑战：${challenge}`,
        metadata: {
          ...baseMetadata,
          chunk_type: 'challenge',
          challenge_text: challenge,
          chunk_index: index,
        },
      });
    });
  }

  // 5. 详细内容块（如果有长内容）
  if (work.content && work.content.length > 200) {
    const contentChunks = splitText(work.content, CHUNK_CONFIG.work);
    contentChunks.forEach((chunk, index) => {
      chunks.push({
        title: `${work.title} - 详细介绍 (第 ${index + 1} 部分)`,
        content: chunk,
        metadata: {
          ...baseMetadata,
          chunk_type: 'content',
          chunk_index: index,
          total_chunks: contentChunks.length,
        },
      });
    });
  }

  const techCount = work.technologies?.length || 0;
  const featureCount = work.features?.length || 0;
  const challengeCount = work.challenges?.length || 0;

  console.log(`[作品分块] ${work.title}: 概览1 + 技术栈${techCount} + 功能${featureCount} + 挑战${challengeCount} = ${chunks.length}个块`);
  return chunks;
}

/**
 * 照片结构化分块 - 方案A（优化版）
 * 生成优化的向量块：增强时间和地点的关联
 * @param {Object} photo - 照片对象
 * @param {string} analysis - AI分析结果
 * @returns {Array<{title: string, content: string, metadata: Object}>}
 */
function splitPhoto(photo, analysis) {
  const chunks = [];
  const baseMetadata = {
    source_type: 'photo',
    source_id: photo.id,
    title: photo.title,
    category: photo.category,
    location: photo.location,
    taken_at: photo.taken_at,
    published: photo.published,
    created_at: photo.created_at,
    searchable_text: `${photo.title} ${photo.category || ''} ${photo.location || ''}`,
    weight: 1.0,
    image_url: photo.image_url,
  };

  // 提取年份和月份
  let yearMonth = '';
  let yearOnly = '';
  if (photo.taken_at) {
    const date = new Date(photo.taken_at);
    yearMonth = `${date.getFullYear()}年${date.getMonth() + 1}月`;
    yearOnly = `${date.getFullYear()}年`;
  }

  let chunkIndex = 0;

  // 1. 地点+时间块（核心块，最重要）
  // 这个块回答"某时间去过哪里"的问题
  if (photo.location) {
    const locationTimeParts = [];
    locationTimeParts.push(`在[${photo.location}]拍摄的照片`);

    // 加入时间信息
    if (photo.taken_at) {
      locationTimeParts.push(`，拍摄时间：${yearMonth}`);
    }

    locationTimeParts.push(`，作品名：《${photo.title}》`);

    if (photo.description) {
      locationTimeParts.push(`。${photo.description}`);
    }

    chunks.push({
      title: `地点：${photo.location}${photo.taken_at ? ` (${yearMonth})` : ''}`,
      content: locationTimeParts.join(''),
      metadata: {
        ...baseMetadata,
        chunk_type: 'location_time',
        location_text: photo.location,
        year: photo.taken_at ? new Date(photo.taken_at).getFullYear() : null,
        month: photo.taken_at ? new Date(photo.taken_at).getMonth() + 1 : null,
        chunk_index: chunkIndex++,
      },
    });
  }

  // 2. 时间+地点块（反向块）
  // 这个块回答"某年去了哪里"的问题
  // 只要有拍摄时间就生成，不再依赖 location 或 category
  if (photo.taken_at) {
    const timeLocationParts = [];

    // 明确提到年份，便于检索"2025年"
    timeLocationParts.push(`${yearOnly}拍摄的照片`);

    // 如果有地点，突出地点
    if (photo.location) {
      timeLocationParts.push(`，拍摄地点：${photo.location}`);
    }

    timeLocationParts.push(`，作品名：《${photo.title}》`);

    if (photo.category) {
      timeLocationParts.push(`，分类：${photo.category}`);
    }

    if (analysis) {
      timeLocationParts.push(`。画面内容：${analysis}`);
    }

    chunks.push({
      title: `${yearOnly}的摄影作品${photo.location ? ` - ${photo.location}` : ''}`,
      content: timeLocationParts.join(''),
      metadata: {
        ...baseMetadata,
        chunk_type: 'time_location',
        year: new Date(photo.taken_at).getFullYear(),
        month: new Date(photo.taken_at).getMonth() + 1,
        location_text: photo.location || null,
        chunk_index: chunkIndex++,
      },
    });
  }

  // 3. 主题块 - 分类 + AI场景分析
  const themeParts = [`摄影作品《${photo.title}》`];
  if (photo.category) {
    themeParts.push(`，分类：${photo.category}`);
  }
  if (analysis) {
    themeParts.push(`。画面分析：${analysis}`);
  }
  if (photo.description) {
    themeParts.push(`。作品描述：${photo.description}`);
  }

  chunks.push({
    title: photo.title,
    content: themeParts.join(''),
    metadata: {
      ...baseMetadata,
      chunk_type: 'theme',
      analysis: analysis,
      chunk_index: chunkIndex++,
    },
  });

  const locationCount = photo.location ? 1 : 0;
  const timeCount = photo.taken_at ? 1 : 0;

  console.log(`[照片分块] ${photo.title}: 地点时间${locationCount} + 时间地点${timeCount} + 主题1 = ${chunks.length}个块`);
  return chunks;
}

export { CHUNK_CONFIG, splitText, splitBlog, splitWork, splitPhoto };
