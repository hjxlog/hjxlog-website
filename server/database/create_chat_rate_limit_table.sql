-- AI 聊天访问限制表
CREATE TABLE IF NOT EXISTS chat_rate_limits (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    request_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ip_address, request_date)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_chat_rate_limits_ip_date ON chat_rate_limits(ip_address, request_date);

-- 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION update_chat_rate_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_chat_rate_limits_updated_at ON chat_rate_limits;
CREATE TRIGGER trigger_update_chat_rate_limits_updated_at
    BEFORE UPDATE ON chat_rate_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_rate_limits_updated_at();

-- 注释
COMMENT ON TABLE chat_rate_limits IS 'AI 聊天每日访问限制表';
COMMENT ON COLUMN chat_rate_limits.ip_address IS '客户端 IP 地址';
COMMENT ON COLUMN chat_rate_limits.request_date IS '请求日期';
COMMENT ON COLUMN chat_rate_limits.request_count IS '当日请求次数';
