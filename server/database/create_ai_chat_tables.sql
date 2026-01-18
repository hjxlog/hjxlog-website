-- server/database/create_ai_chat_tables.sql
-- AI 聊天助手数据库表

-- 启用 PGVector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 知识库文档表
CREATE TABLE IF NOT EXISTS knowledge_base (
                                              id SERIAL PRIMARY KEY,
                                              source_type VARCHAR(50) NOT NULL,      -- 'blog', 'work', 'moment', 'custom'
    source_id INTEGER,                     -- 关联的内容ID (custom类型为null)
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,                 -- 分块后的文本内容
    metadata JSONB DEFAULT '{}'::jsonb,    -- 额外信息（分类、标签等）
    embedding vector(1024),                -- 智谱 embedding-2 的向量（建议写入时不为 NULL）
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
    );

-- （推荐）常用过滤字段索引：后续检索时按 source_type/source_id 过滤会更快
CREATE INDEX IF NOT EXISTS idx_kb_source_type ON knowledge_base (source_type);
CREATE INDEX IF NOT EXISTS idx_kb_source_id   ON knowledge_base (source_id);

-- 创建向量索引 (使用余弦距离)
-- 注意：pgvector 的索引方法是 ivfflat 或 hnsw
CREATE INDEX IF NOT EXISTS idx_kb_embedding
    ON knowledge_base
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- 聊天会话表
CREATE TABLE IF NOT EXISTS chat_sessions (
                                             id SERIAL PRIMARY KEY,
                                             session_id VARCHAR(100) UNIQUE NOT NULL,
    messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
    );

-- 更新时间函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 触发器
DROP TRIGGER IF EXISTS update_kb_updated_at ON knowledge_base;
CREATE TRIGGER update_kb_updated_at
    BEFORE UPDATE ON knowledge_base
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON chat_sessions;
CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 添加注释
COMMENT ON TABLE knowledge_base IS 'AI 知识库文档表';
COMMENT ON TABLE chat_sessions IS '聊天会话记录表';
COMMENT ON COLUMN knowledge_base.embedding IS '向量 embedding (1024维，智谱 embedding-2)';
COMMENT ON COLUMN knowledge_base.source_type IS '来源类型: blog, work, moment, custom';
