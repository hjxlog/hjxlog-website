-- ================================================
-- Task Memory 功能 - 数据库表结构
-- 创建日期: 2026-02-05
-- 说明: 每日想法记录 + AI 自动总结到长期记忆
-- ================================================

-- 每日想法表
CREATE TABLE daily_thoughts (
    id SERIAL PRIMARY KEY,
    thought_date DATE UNIQUE NOT NULL,           -- 唯一日期
    content TEXT NOT NULL,                       -- Markdown 格式的想法内容
    mood VARCHAR(50),                            -- 可选：当天心情
    tags TEXT[] DEFAULT '{}',                     -- 可选：标签
    is_summarized BOOLEAN DEFAULT false,         -- 是否已总结到长期记忆
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 长期记忆表
CREATE TABLE long_term_memory (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,                 -- 记忆标题
    content TEXT NOT NULL,                       -- 精炼内容
    source_date DATE,                            -- 来源日期（关联到 daily_thoughts）
    category VARCHAR(100),                       -- 分类（如"决策"、"教训"、"洞察"）
    importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10), -- 重要性 1-10
    tags TEXT[] DEFAULT '{}',                    -- 标签
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX idx_daily_thoughts_date ON daily_thoughts(thought_date DESC);
CREATE INDEX idx_daily_thoughts_summarized ON daily_thoughts(is_summarized);
CREATE INDEX idx_long_term_memory_category ON long_term_memory(category);
CREATE INDEX idx_long_term_memory_importance ON long_term_memory(importance DESC);
CREATE INDEX idx_long_term_memory_source_date ON long_term_memory(source_date DESC);
CREATE INDEX idx_long_term_memory_created_at ON long_term_memory(created_at DESC);

-- 创建更新时间触发器（复用现有函数）
CREATE TRIGGER update_daily_thoughts_updated_at
    BEFORE UPDATE ON daily_thoughts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_long_term_memory_updated_at
    BEFORE UPDATE ON long_term_memory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 添加表注释
COMMENT ON TABLE daily_thoughts IS '每日想法记录表';
COMMENT ON TABLE long_term_memory IS '长期记忆表（AI 总结提炼）';

-- 添加字段注释
COMMENT ON COLUMN daily_thoughts.thought_date IS '想法日期（唯一）';
COMMENT ON COLUMN daily_thoughts.content IS 'Markdown 格式的想法内容';
COMMENT ON COLUMN daily_thoughts.mood IS '当天心情（可选）';
COMMENT ON COLUMN daily_thoughts.tags IS '标签数组';
COMMENT ON COLUMN daily_thoughts.is_summarized IS '是否已总结到长期记忆';

COMMENT ON COLUMN long_term_memory.title IS '记忆标题';
COMMENT ON COLUMN long_term_memory.content IS 'AI 总结后的精炼内容';
COMMENT ON COLUMN long_term_memory.source_date IS '来源日期（关联 daily_thoughts）';
COMMENT ON COLUMN long_term_memory.category IS '记忆分类（决策/教训/洞察/其他）';
COMMENT ON COLUMN long_term_memory.importance IS '重要性评分（1-10）';
COMMENT ON COLUMN long_term_memory.tags IS '标签数组';

-- 显示创建结果
SELECT 'Task Memory tables created successfully!' as result;
