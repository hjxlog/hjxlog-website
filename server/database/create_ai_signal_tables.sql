-- server/database/create_ai_signal_tables.sql
-- AI 资讯信号与每日简报

-- 更新时间函数（若不存在则创建/覆盖）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 资讯条目
CREATE TABLE IF NOT EXISTS ai_source_items (
    id SERIAL PRIMARY KEY,
    source_id INTEGER NOT NULL REFERENCES ai_sources(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    summary TEXT,
    raw JSONB DEFAULT '{}'::jsonb,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 每日简报
CREATE TABLE IF NOT EXISTS ai_daily_digests (
    id SERIAL PRIMARY KEY,
    digest_date DATE NOT NULL UNIQUE,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'ready', -- ready/empty/error
    summary_text TEXT,
    items JSONB DEFAULT '[]'::jsonb, -- [{item_id,title,summary,importance,question,types,score}]
    empty_reason TEXT,
    source_window_days INTEGER NOT NULL DEFAULT 3,
    max_items INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 用户观点
CREATE TABLE IF NOT EXISTS ai_user_opinions (
    id SERIAL PRIMARY KEY,
    digest_id INTEGER REFERENCES ai_daily_digests(id) ON DELETE SET NULL,
    item_id INTEGER REFERENCES ai_source_items(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    opinion_text TEXT NOT NULL,
    assistant_reply TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 触发器
DROP TRIGGER IF EXISTS update_ai_source_items_updated_at ON ai_source_items;
CREATE TRIGGER update_ai_source_items_updated_at
    BEFORE UPDATE ON ai_source_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_daily_digests_updated_at ON ai_daily_digests;
CREATE TRIGGER update_ai_daily_digests_updated_at
    BEFORE UPDATE ON ai_daily_digests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_user_opinions_updated_at ON ai_user_opinions;
CREATE TRIGGER update_ai_user_opinions_updated_at
    BEFORE UPDATE ON ai_user_opinions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 注释
COMMENT ON TABLE ai_source_items IS 'AI 资讯源条目';
COMMENT ON TABLE ai_daily_digests IS 'AI 每日简报';
COMMENT ON TABLE ai_user_opinions IS '用户观点记录';
