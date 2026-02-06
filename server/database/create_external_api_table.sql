-- ================================================
-- 外部API Token管理表
-- ================================================

-- 删除已存在的表（如果存在）
DROP TABLE IF EXISTS external_api_tokens CASCADE;

-- 创建外部API Token表
CREATE TABLE external_api_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE,
    token_hash VARCHAR(64) UNIQUE,
    token_prefix VARCHAR(20),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    source VARCHAR(50) NOT NULL, -- 'openclaw', 'mobile_app', 'other'
    scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    last_used_ip INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE,
    rotated_from_id INTEGER REFERENCES external_api_tokens(id) ON DELETE SET NULL,
    created_by VARCHAR(50) DEFAULT 'admin',
    CHECK (token IS NOT NULL OR token_hash IS NOT NULL)
);

-- 创建索引
CREATE INDEX idx_external_api_tokens_token ON external_api_tokens(token);
CREATE INDEX idx_external_api_tokens_token_hash ON external_api_tokens(token_hash);
CREATE INDEX idx_external_api_tokens_source ON external_api_tokens(source);
CREATE INDEX idx_external_api_tokens_scopes ON external_api_tokens USING GIN (scopes);
CREATE INDEX idx_external_api_tokens_is_active ON external_api_tokens(is_active);

-- 添加注释
COMMENT ON TABLE external_api_tokens IS '外部API访问令牌表';
COMMENT ON COLUMN external_api_tokens.token IS 'API令牌（唯一）';
COMMENT ON COLUMN external_api_tokens.token_hash IS 'API令牌哈希（SHA-256）';
COMMENT ON COLUMN external_api_tokens.token_prefix IS '令牌前缀（仅用于展示）';
COMMENT ON COLUMN external_api_tokens.name IS '令牌名称';
COMMENT ON COLUMN external_api_tokens.description IS '令牌描述';
COMMENT ON COLUMN external_api_tokens.source IS '来源系统（openclaw/mobile_app/other）';
COMMENT ON COLUMN external_api_tokens.scopes IS '细粒度权限列表';
COMMENT ON COLUMN external_api_tokens.is_active IS '是否激活';
COMMENT ON COLUMN external_api_tokens.expires_at IS '过期时间';
COMMENT ON COLUMN external_api_tokens.last_used_at IS '最后使用时间';
COMMENT ON COLUMN external_api_tokens.last_used_ip IS '最后使用IP';
COMMENT ON COLUMN external_api_tokens.created_by IS '创建者';

-- 插入默认token（用于OpenClaw）
-- 注意：生产环境中应该使用更强的随机token
INSERT INTO external_api_tokens (token, token_prefix, name, description, source, scopes, created_by)
VALUES (
    'oc_' || md5(random()::text || clock_timestamp()::text),
    'oc_default',
    'OpenClaw内部Token',
    '用于OpenClaw系统推送日记和动态',
    'openclaw',
    '["openclaw:reports:write"]'::jsonb,
    'admin'
);

-- 显示创建结果
SELECT 'external_api_tokens table created successfully!' as result;
SELECT token, name, source FROM external_api_tokens;
