-- server/database/create_ai_sources_tables.sql
-- AI 资讯源与权重表

-- 更新时间函数（若不存在则创建/覆盖）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 资讯源表
CREATE TABLE IF NOT EXISTS ai_sources (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    rss_url TEXT,
    type VARCHAR(30) NOT NULL, -- blog/news/research/forum/personal/newsletter
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 方向权重表
CREATE TABLE IF NOT EXISTS ai_source_weights (
    id SERIAL PRIMARY KEY,
    source_id INTEGER NOT NULL REFERENCES ai_sources(id) ON DELETE CASCADE,
    category VARCHAR(30) NOT NULL, -- model/application/engineering/research/safety
    weight NUMERIC(4, 3) NOT NULL DEFAULT 0.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (source_id, category)
);

-- 触发器
DROP TRIGGER IF EXISTS update_ai_sources_updated_at ON ai_sources;
CREATE TRIGGER update_ai_sources_updated_at
    BEFORE UPDATE ON ai_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_source_weights_updated_at ON ai_source_weights;
CREATE TRIGGER update_ai_source_weights_updated_at
    BEFORE UPDATE ON ai_source_weights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 注释
COMMENT ON TABLE ai_sources IS 'AI 资讯源列表';
COMMENT ON TABLE ai_source_weights IS '资讯源方向权重';
COMMENT ON COLUMN ai_sources.type IS '来源类型';
COMMENT ON COLUMN ai_sources.rss_url IS 'RSS/Atom 订阅地址';
COMMENT ON COLUMN ai_source_weights.category IS '方向分类';
