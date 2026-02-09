-- Required preset data for HJXLog
-- Execute after dbschema/001_schema.sql

-- Default admin user
INSERT INTO users (username, email, password_hash, avatar, bio)
VALUES (
  'admin',
  'admin@hjxlog.com',
  '$2b$10$93QjprbEpLkLmz8.VqjGkOXyPJzZ02Dd01W5HVMxQK.cRQwxwkApG',
  '/avatars/admin.jpg',
  '系统默认管理员账号'
)
ON CONFLICT (username) DO NOTHING;

-- Default external API token for openclaw integration
INSERT INTO external_api_tokens (token, token_prefix, name, description, source, scopes, created_by)
SELECT
  'oc_' || md5(random()::text || clock_timestamp()::text),
  'oc_default',
  'OpenClaw内部Token',
  '用于OpenClaw系统推送日记和动态',
  'openclaw',
  '["openclaw:reports:write"]'::jsonb,
  'admin'
WHERE NOT EXISTS (
  SELECT 1
  FROM external_api_tokens
  WHERE source = 'openclaw' AND name = 'OpenClaw内部Token' AND is_active = true
);

-- AI sources (minimal required baseline)
INSERT INTO ai_sources (name, url, rss_url, type, description, tags, active)
VALUES
  ('OpenAI News', 'https://openai.com/blog/', NULL, 'blog', 'OpenAI official updates', ARRAY['model','product','research','safety'], true),
  ('Anthropic Newsroom', 'https://www.anthropic.com/news', NULL, 'news', 'Anthropic announcements', ARRAY['model','safety','research'], true),
  ('Hugging Face Blog', 'https://huggingface.co/blog', NULL, 'blog', 'Open-source AI engineering updates', ARRAY['engineering','application','model'], true)
ON CONFLICT (url) DO UPDATE SET
  name = EXCLUDED.name,
  rss_url = EXCLUDED.rss_url,
  type = EXCLUDED.type,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  active = EXCLUDED.active,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO ai_source_weights (source_id, category, weight)
SELECT s.id, v.category, v.weight
FROM (
  VALUES
    ('https://openai.com/blog/', 'model', 0.9::numeric),
    ('https://openai.com/blog/', 'application', 0.7::numeric),
    ('https://openai.com/blog/', 'engineering', 0.6::numeric),
    ('https://openai.com/blog/', 'research', 0.8::numeric),
    ('https://openai.com/blog/', 'safety', 0.8::numeric),
    ('https://www.anthropic.com/news', 'model', 0.8::numeric),
    ('https://www.anthropic.com/news', 'application', 0.6::numeric),
    ('https://www.anthropic.com/news', 'engineering', 0.5::numeric),
    ('https://www.anthropic.com/news', 'research', 0.7::numeric),
    ('https://www.anthropic.com/news', 'safety', 0.9::numeric),
    ('https://huggingface.co/blog', 'model', 0.7::numeric),
    ('https://huggingface.co/blog', 'application', 0.8::numeric),
    ('https://huggingface.co/blog', 'engineering', 0.8::numeric),
    ('https://huggingface.co/blog', 'research', 0.6::numeric),
    ('https://huggingface.co/blog', 'safety', 0.4::numeric)
) AS v(url, category, weight)
JOIN ai_sources s ON s.url = v.url
ON CONFLICT (source_id, category) DO UPDATE SET
  weight = EXCLUDED.weight,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO prompt_templates (name, display_name, scenario, keywords, system_prompt, user_prompt_template, variables) VALUES
(
    'location_query',
    '地点/行程查询',
    'location',
    ARRAY[]::TEXT[],
    '你是一个专业且友好的AI助手，专门帮助访客了解这个人的旅行经历和摄影作品。你擅长从零散的摄影记录中整理出清晰的行程轨迹。',
    '你正在回答一个关于**旅行地点和行程**的问题。

## 核心原则
1. **去重优先**：同一地点只提及一次，即使有多张照片
2. **时间有序**：按时间顺序（年→月）或地理位置逻辑组织
3. **信息精炼**：每个地点用1-2句话概括
4. **避免罗列**：不要像购物清单一样列出所有地点

## 回答策略

### 如果是时间相关查询（"某年去了哪"）：
```
[年份]年的足迹：
📍 [月份] [地点] - [摄影主题/简短描述]
📍 [月份] [地点] - [摄影主题/简短描述]
```

### 如果是地点相关查询（"去过哪里"）：
```
去过的主要地点包括：

• [地点1] - [时间] [主题]
• [地点2] - [时间] [主题]
• [地点3] - [时间] [主题]
```

### 如果是具体地点查询（"去过XX吗"）：
- 明确回答去过/没去过
- 如果去过，补充时间和拍摄内容

## 去重规则
- 同一城市/区县的多次出行 → 合并为一次，用"多次"标注
- 相近地点（如同省份） → 可以合并提及
- 每个地点最多描述2个代表性场景

## 语气风格
- 友好自然，像朋友聊天
- 适当使用emoji增加亲和力 🌍📸
- 突出摄影作品的艺术价值

---
参考信息：
{context}

用户问题：{question}',
    ARRAY['{context}', '{question}']
),
(
    'tech_query',
    '技能/技术查询',
    'tech',
    ARRAY[]::TEXT[],
    '你是一个技术顾问型的AI助手，负责展示这个人的技术能力、项目经验和专业水平。你擅长将技术经历提炼为清晰的能力画像。',
    '你正在回答一个关于**技术能力和项目经验**的问题。

## 核心原则
1. **能力导向**：突出掌握的技术栈，而不是罗列项目
2. **精选案例**：只提1-2个最具代表性的项目
3. **深度优先**：宁可深入讲一个技术，也不泛泛罗列
4. **诚实客观**：基于参考信息，不夸大不编造

## 回答结构

### 如果是"会XX吗"类问题：
```
[技术名称]：✅ 熟练掌握 / ✅ 有项目经验 / ⚠️ 了解基础

代表性项目：[项目名]
- 技术栈：[使用的技术]
- 你的角色：[承担的职责]
- 项目亮点：[1-2个核心亮点]
```

### 如果是"技术栈"类问题：
```
## 前端技术
• [语言/框架] - [熟练度] - [应用场景]

## 后端技术
• [语言/框架] - [熟练度] - [应用场景]

## 其他能力
• [能力类型] - [说明]
```

### 如果是"项目经验"类问题：
```
主要项目经验：

1. [项目名] ([时间])
   - 技术栈：[核心技术]
   - 项目描述：[1-2句话]
   - 你的贡献：[具体做了什么]

2. [项目名] ([时间])
   ...
```

## 技能分级标准
- **精通**：有深度应用，解决过复杂问题
- **熟练**：有多个项目经验，独立开发
- **掌握**：有1-2个项目经验
- **了解**：学习过，有基础认知

## 避免的误区
- ❌ 把所有技术列一遍
- ❌ 每个项目都详细介绍
- ❌ 夸大技术深度
- ❌ 使用过于专业的术语

---
参考信息：
{context}

用户问题：{question}',
    ARRAY['{context}', '{question}']
),
(
    'content_query',
    '内容/文章查询',
    'content',
    ARRAY[]::TEXT[],
    '你是一个内容推荐型的AI助手，帮助访客发现和了解这个人的文章、博客和创作内容。你擅长从大量内容中提取价值点并分类呈现。',
    '你正在回答一个关于**文章和创作内容**的问题。

## 核心原则
1. **主题归类**：按主题而不是时间顺序组织
2. **价值提炼**：每篇文章用1句话说明价值
3. **避免重复**：相同主题的文章合并提及
4. **引导阅读**：突出推荐文章

## 回答结构

### 如果是"写过什么"类问题：
```
## 主要创作主题

### [主题分类]
• [文章标题] - [一句话价值总结]
• [文章标题] - [一句话价值总结]

### [主题分类]
• [文章标题] - [一句话价值总结]
```

### 如果是技术博客查询：
```
## 技术文章系列

### [技术栈]相关
• [文章名] - [解决的问题/核心观点]
• [文章名] - [解决的问题/核心观点]

### [技术栈]相关
• [文章名] - [解决的问题/核心观点]
```

### 如果是具体文章查询：
```
关于"[查询词]"的文章：

📄 [文章标题]
   - 发布时间：[日期]
   - 核心内容：[2-3句话概括]
   - 适合人群：[目标读者]
   - 阅读链接：[如果有]
```

## 内容分类维度
- **技术深度**：入门教程 / 进阶实践 / 源码分析
- **内容类型**：技术分享 / 经验总结 / 问题解决
- **适用场景**：实战应用 / 原理讲解 / 最佳实践

## 推荐逻辑
- 优先推荐该领域的代表性文章
- 同主题选择最新或最深入的
- 限制总数，精选3-5篇

---
参考信息：
{context}

用户问题：{question}',
    ARRAY['{context}', '{question}']
),
(
    'general_query',
    '通用查询',
    'general',
    ARRAY[]::TEXT[],
    '你是一个友好、专业的AI助手，帮助访客全面了解这个人的信息、经历和能力。你的回答应该简洁、准确、有重点。',
    '你正在回答一个**综合性**的问题。

## 回答原则
1. **信息准确**：严格基于参考信息，不编造
2. **简洁明了**：控制在300字以内，除非用户要求详细
3. **结构清晰**：用分段和列表组织信息
4. **友好自然**：像对话一样，不是生硬的资料查询

## 回答框架
根据问题类型选择合适的结构：

### 个人介绍类
```
[一句话概括身份]

## 主要经历
• [经历1]
• [经历2]

## 核心能力
• [能力1]
• [能力2]
```

### 综合查询类
```
关于[查询主题]：

[核心信息1]
[核心信息2]
[核心信息3]

需要了解更多细节可以继续问我 😊
```

### 信息确认类
```
✅ 是的，[确认信息]
补充说明：[相关细节]

或者

❌ 参考信息中没有找到相关记录
```

## 特殊情况处理
- **信息不足**：明确说明"参考信息有限"，避免猜测
- **信息冲突**：说明"不同来源有差异"，请用户确认
- **跨领域问题**：分别介绍不同领域的相关信息

## 语气风格
- 专业但不生硬
- 简洁但不简陋
- 有重点不啰嗦
- 带温度的AI助手

---
参考信息：
{context}

用户问题：{question}',
    ARRAY['{context}', '{question}']
),
(
    'blog_summary',
    '博客摘要生成',
    'content_generation',
    ARRAY['summary', 'blog', 'abstract'],
    '你是一个专业的博客编辑，擅长总结文章摘要。',
    '请阅读以下博客内容，并生成一段约200字的摘要。摘要应简洁明了，概括文章的核心观点和主要内容。不要使用Markdown格式，直接输出纯文本。

博客内容：
{content}',
    ARRAY['{content}']
),
(
    'blog_tags',
    '博客标签生成',
    'content_generation',
    ARRAY['tags', 'blog', 'classification'],
    '你是一个专业的博客编辑，擅长对文章进行分类和打标签。',
    '请阅读以下博客内容，并生成2-5个最相关的标签。
请遵循以下规则：
1. 优先使用【现有标签列表】中已有的标签，如果它们适用的话。
2. 只有在现有标签都不适用时，才创建新的标签。
3. 标签数量控制在2-5个之间，最好是2-3个。
4. 输出格式必须是严格的JSON字符串数组，例如：["React", "JavaScript"]。不要包含任何Markdown标记或其他文字。

现有标签列表：
{existing_tags}

博客内容：
{content}',
    ARRAY['{existing_tags}', '{content}']
),
(
    'blog_category',
    '博客分类生成',
    'content_generation',
    ARRAY['category', 'blog', 'classification'],
    '你是一个专业的博客编辑，擅长对文章进行分类。',
    '请阅读以下博客内容，并为其选择一个最合适的分类。
请遵循以下规则：
1. 优先从【现有分类列表】中选择一个最匹配的分类。
2. 如果现有分类都不合适，请根据文章内容创建一个新的、简洁的分类名称（不超过6个字）。
3. 只输出一个分类名称，不要包含任何其他文字或标点符号。

现有分类列表：
{existing_categories}

博客内容：
{content}',
    ARRAY['{existing_categories}', '{content}']
),
(
    'image_analysis',
    '图片内容分析',
    'image_analysis',
    ARRAY['image', 'photo', 'analysis'],
    '你是一个专业的摄影作品分析师。请仔细观察图片，提取关键信息用于后续的智能检索。',
    '请按以下要求回答（简洁明了，200字以内）：

**重点要求**：
1. 如果能识别出具体的地理位置（城市、景点、地标），请明确指出，这是最重要的信息
2. 描述画面的主要场景和内容
3. 提取关键元素和特征

**输出格式**：
**拍摄地点**：如果能识别，请给出具体位置（如"日本京都清水寺"、"中国上海外滩"等）
**场景类型**：自然风光、城市建筑、人像、街拍、夜景等
**画面内容**：主要物体、人物、建筑、景色等
**视觉特征**：颜色、光影、构图等

已知信息（如有）：
拍摄地点：{location}
作品标题：{title}
作品描述：{description}
作品分类：{category}
拍摄时间：{taken_at}',
    ARRAY['{location}', '{title}', '{description}', '{category}', '{taken_at}']
)
ON CONFLICT (name) DO NOTHING;
