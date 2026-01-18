# AI 聊天助手 (RAG) 设计文档

## 项目概述

为个人展示网站开发基于 RAG（检索增强生成）的 AI 聊天助手，让访客（尤其是潜在雇主）可以通过对话方式了解网站信息。

### 核心价值
- **技术展示**: 展示对大模型、向量数据库、RAG 技术的掌握
- **用户体验**: 交互式问答比静态简历更生动
- **实用价值**: 帮助访客快速找到感兴趣的信息

## 技术架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (React)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  聊天界面     │  │  管理后台     │  │  知识库管理   │      │
│  │  ChatWidget  │  │  AIAdmin     │  │  KBManager   │      │
│  └──────┬───────┘  └──────────────┘  └──────────────┘      │
│         │                                                      │
│         │ SSE / REST API                                      │
└─────────┼──────────────────────────────────────────────────────┘
          │
┌─────────▼────────────────────────────────────────────────────┐
│                      后端 (Express.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  聊天API      │  │  向量服务     │  │  知识库API    │      │
│  │  /api/chat   │  │  VectorService│  │  /api/kb     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘      │
│         │                  │                                  │
│  ┌──────▼──────────────────▼──────────────────┐             │
│  │         PostgreSQL + PGVector              │             │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐ │             │
│  │  │ blogs    │  │ documents│  │ vectors  │ │             │
│  │  └──────────┘  └──────────┘  └──────────┘ │             │
│  └────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
          │
┌─────────▼────────────────────────────────────────────────────┐
│                   智谱 AI (云 API)                            │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │ GLM-4.7      │  │ Embedding-2  │                         │
│  │ (LLM)        │  │ (嵌入模型)    │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### 技术选型

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| **向量数据库** | PGVector | PostgreSQL 扩展，复用现有数据库 |
| **嵌入模型** | 智谱 Embedding-2 | 1024维，中文优化 |
| **LLM** | 智谱 GLM-4.7 | 中文能力强，性价比高 |
| **相似度算法** | 余弦相似度 | PGVector `<=>` 操作符 |
| **流式传输** | SSE (Server-Sent Events) | 实时推送回答 |

### 为什么不用 Ollama？

服务器配置 2核4G，跑本地模型压力较大。选择云 API 方案：
- 嵌入 + LLM 都用智谱，架构统一
- API 费用低廉（个人网站流量不大）
- 服务器零压力，效果好

## 数据库设计

### 新增表结构

```sql
-- 启用 PGVector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 知识库文档表
CREATE TABLE knowledge_base (
    id SERIAL PRIMARY KEY,
    source_type VARCHAR(50) NOT NULL,      -- 'blog', 'work', 'moment', 'custom'
    source_id INTEGER,                     -- 关联的内容ID (custom类型为null)
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,                 -- 分块后的文本内容
    metadata JSONB,                        -- 额外信息（分类、标签等）
    embedding vector(1024),                -- 智谱 embedding-2 的向量
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 向量相似度索引
CREATE INDEX idx_kb_embedding ON knowledge_base USING ivv (embedding vector_cosine_ops);

-- 聊天会话表（用于多轮对话）
CREATE TABLE chat_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 更新时间触发器
CREATE TRIGGER update_kb_updated_at
    BEFORE UPDATE ON knowledge_base
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 核心功能设计

### 1. 数据准备流程

```
博客/作品内容
    ↓
文本分块 (300-500字/块，50字重叠)
    ↓
调用智谱 Embedding API
    ↓
存入 knowledge_base 表
```

**分块策略**:
- `maxChunkSize`: 500 字
- `chunkOverlap`: 50 字（保持上下文连续性）
- `minChunkSize`: 100 字

### 2. RAG 问答流程

```
用户提问
    ↓
1. 问题向量化 (Embedding API)
    ↓
2. 向量检索 (PGVector)
   - 计算余弦距离
   - 返回 Top 5 相关文档
    ↓
3. 构建 Prompt
   - 系统提示词
   - 参考信息
   - 用户问题
    ↓
4. 调用 GLM-4.7 (流式)
    ↓
5. 返回回答
```

### 3. 服务层设计

```javascript
// EmbeddingService - 嵌入服务
class EmbeddingService {
  async embedText(text)           // 单个文本向量化
  async embedBatch(texts)         // 批量向量化（优化API调用）
  async processBlog(blog)         // 处理博客内容
  async processWork(work)         // 处理作品内容
}

// LLMService - 大模型服务
class LLMService {
  async streamChat(prompt)        // 流式对话
  async chat(messages)            // 非流式对话
}

// RAGService - RAG核心服务
class RAGService {
  async chat(question, sessionId) // 主问答方法
  async searchSimilar(embedding)  // 向量检索
  buildPrompt(question, docs)     // 构建提示词
  getChatHistory(sessionId)       // 获取历史
}
```

## API 接口设计

### 聊天接口

```http
POST /api/chat
Content-Type: application/json

Request:
{
  "message": "这个人的技术栈是什么？",
  "session_id": "optional-session-id"
}

Response (SSE 流式):
data: {"token": "根"}
data: {"token": "据"}
data: {"token": "网站"}
...
data: {"done": true, "sources": [{"title": "...", "type": "blog"}]}
```

### 知识库管理接口

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/knowledge-base/status | GET | 获取统计信息 |
| /api/knowledge-base/rebuild | POST | 重建知识库 |
| /api/knowledge-base/documents | POST | 添加自定义文档 |
| /api/knowledge-base/search | GET | 测试搜索 |

## 前端界面设计

### 聊天组件结构

```
AIAssistant (主组件)
├── FloatingButton (悬浮按钮)
└── ChatWindow (聊天窗口)
    ├── Header (标题 + 关闭按钮)
    ├── MessageList (消息列表)
    │   ├── UserMessage
    │   ├── AssistantMessage
    │   └── TypingIndicator (打字动画)
    ├── QuickQuestions (快捷问题)
    └── InputArea (输入框 + 发送按钮)
```

### 管理后台

```
KnowledgeBaseAdmin
├── StatsCard (统计卡片)
├── ActionButtons (操作按钮)
└── DocumentList (文档列表)
```

### 关键特性

- **流式显示**: 打字机效果，实时展示 AI 回答
- **来源引用**: 显示信息来源，可点击跳转
- **快捷问题**: 预设常用问题，一键提问
- **响应式**: 适配移动端
- **动画效果**: 平滑的打开/关闭、消息渐入

## 实现计划

### 阶段 1: 基础设施
- [ ] 安装 PGVector 扩展
- [ ] 创建数据库表
- [ ] 配置智谱 SDK (`zhipuai` npm 包)
- [ ] 添加环境变量 (`ZHIPU_API_KEY`)

### 阶段 2: 向量化服务
- [ ] 实现文本分块逻辑
- [ ] 封装 EmbeddingService
- [ ] 实现文档入库功能
- [ ] 编写初始化脚本

### 阶段 3: RAG 核心
- [ ] 封装 LLMService
- [ ] 实现向量检索
- [ ] 实现 RAGService
- [ ] Prompt 工程优化

### 阶段 4: API 开发
- [ ] 聊天接口 (SSE)
- [ ] 知识库管理接口
- [ ] 集成到 server.js

### 阶段 5: 前端开发
- [ ] 聊天组件
- [ ] 悬浮按钮
- [ ] 流式消息显示
- [ ] 管理后台页面

### 阶段 6: 测试优化
- [ ] 功能测试
- [ ] 性能优化
- [ ] 用户体验优化

## 文件结构

```
server/
├── services/
│   ├── EmbeddingService.js
│   ├── LLMService.js
│   └── RAGService.js
├── routes/
│   └── chatRouter.js
├── scripts/
│   └── initKnowledgeBase.js
├── utils/
│   └── textChunker.js
└── database/
    └── create_ai_chat_tables.sql

src/
├── components/chat/
│   ├── AIAssistant.tsx
│   ├── ChatWindow.tsx
│   ├── MessageList.tsx
│   ├── InputArea.tsx
│   └── FloatingButton.tsx
├── pages/admin/
│   └── KnowledgeBase.tsx
└── config/
    └── zhipu.ts
```

## Prompt 模板

```javascript
const SYSTEM_PROMPT = `你是一个AI助手，帮助访客了解这个人的信息。

规则：
- 只基于参考信息回答，不要编造
- 如果信息不足，如实说明
- 回答简洁友好，适当使用emoji
- 突出技术能力和项目经验`;

const buildPrompt = (question, documents) => ({
  system: SYSTEM_PROMPT,
  messages: [{
    role: 'user',
    content: `参考信息：\n\n${documents.map(d => `[${d.title}]\n${d.content}`).join('\n\n')}\n\n用户问题：${question}`
  }]
});
```

## 环境变量

```bash
# server/.env
ZHIPU_API_KEY=your_api_key_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hjxlog
DB_USER=postgres
DB_PASSWORD=your_password
```

## 成本估算

智谱 AI 定价（参考）:
- Embedding: ~¥0.0002/1K tokens
- GLM-4.7: ~¥0.5/1K tokens (输入), ~¥1/1K tokens (输出)

个人网站流量（月均 500 次对话）:
- Embedding: ~¥1-2/月
- LLM: ~¥50-100/月

**优化策略**:
- 嵌入缓存（同样问题不重复调用）
- 合理设置 token 限制
- 监控 API 使用量

## 安全考虑

1. **API 密钥保护**: 不暴露给前端
2. **输入过滤**: 防止注入攻击
3. **输出过滤**: 敏感信息脱敏
4. **速率限制**: 防止滥用
5. **日志记录**: 记录异常查询

## 后续扩展

- [ ] 支持图片问答（多模态）
- [ ] 语音输入/输出
- [ ] 个性化推荐（基于用户偏好）
- [ ] 分析能力（用户行为分析）
- [ ] 多语言支持

---

**文档版本**: 1.0
**创建日期**: 2026-01-15
**作者**: Claude Code
