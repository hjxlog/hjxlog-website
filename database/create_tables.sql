-- ================================================
-- HJXLog 博客系统数据库表结构
-- 数据库: hjxlog
-- 用户: postgres
-- 密码: 12345678
-- ================================================

-- 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 删除已存在的表（如果存在）

DROP TABLE IF EXISTS moments CASCADE;
DROP TABLE IF EXISTS blog_views CASCADE;
DROP TABLE IF EXISTS blogs CASCADE;
DROP TABLE IF EXISTS works CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS system_logs CASCADE;
DROP TABLE IF EXISTS photos CASCADE;

-- 创建用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建博客表
CREATE TABLE blogs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(100) NOT NULL DEFAULT 'Admin',
    category VARCHAR(50) NOT NULL,
    tags TEXT[] DEFAULT '{}',
    published BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    views INTEGER DEFAULT 0,
    cover_image TEXT
);

-- 创建作品表
CREATE TABLE works (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    content TEXT,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    tags TEXT[] DEFAULT '{}',
    technologies TEXT[] DEFAULT '{}',
    features TEXT[] DEFAULT '{}',
    challenges TEXT[] DEFAULT '{}',
    screenshots TEXT[] DEFAULT '{}',
    project_url TEXT,
    github_url TEXT,
    cover_image TEXT,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);



-- 创建索引以提高查询性能
CREATE INDEX idx_blogs_category ON blogs(category);
CREATE INDEX idx_blogs_published ON blogs(published);
CREATE INDEX idx_blogs_featured ON blogs(featured);
CREATE INDEX idx_blogs_created_at ON blogs(created_at DESC);
CREATE INDEX idx_blogs_author ON blogs(author);
CREATE INDEX idx_works_category ON works(category);
CREATE INDEX idx_works_status ON works(status);
CREATE INDEX idx_works_featured ON works(featured);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为每个表创建更新时间触发器
CREATE TRIGGER update_blogs_updated_at 
    BEFORE UPDATE ON blogs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_works_updated_at 
    BEFORE UPDATE ON works 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 添加表注释
COMMENT ON TABLE blogs IS '博客表';
COMMENT ON TABLE works IS '作品项目表';
COMMENT ON TABLE users IS '用户表';

-- 添加字段注释
COMMENT ON COLUMN blogs.title IS '博客标题';
COMMENT ON COLUMN blogs.excerpt IS '博客摘要';
COMMENT ON COLUMN blogs.content IS '博客内容';
COMMENT ON COLUMN blogs.author IS '作者';
COMMENT ON COLUMN blogs.category IS '分类';
COMMENT ON COLUMN blogs.tags IS '标签数组';
COMMENT ON COLUMN blogs.published IS '是否发布';
COMMENT ON COLUMN blogs.featured IS '是否推荐到主页';
COMMENT ON COLUMN blogs.views IS '浏览次数';
COMMENT ON COLUMN blogs.cover_image IS '封面图片URL';

COMMENT ON COLUMN works.title IS '作品标题';
COMMENT ON COLUMN works.description IS '作品描述';
COMMENT ON COLUMN works.content IS '项目详细内容';
COMMENT ON COLUMN works.category IS '作品分类';
COMMENT ON COLUMN works.status IS '项目状态';
COMMENT ON COLUMN works.tags IS '标签数组';
COMMENT ON COLUMN works.technologies IS '技术栈数组';
COMMENT ON COLUMN works.features IS '核心功能数组';
COMMENT ON COLUMN works.challenges IS '技术挑战数组';
COMMENT ON COLUMN works.screenshots IS '项目截图数组';
COMMENT ON COLUMN works.project_url IS '项目链接';
COMMENT ON COLUMN works.github_url IS 'GitHub链接';
COMMENT ON COLUMN works.featured IS '是否推荐到主页';

COMMENT ON COLUMN users.username IS '用户名';
COMMENT ON COLUMN users.email IS '邮箱';
COMMENT ON COLUMN users.password_hash IS '密码哈希';
COMMENT ON COLUMN users.avatar IS '头像URL';
COMMENT ON COLUMN users.bio IS '个人简介';



-- 创建博客浏览记录表（用于IP限制）
CREATE TABLE blog_views (
    id SERIAL PRIMARY KEY,
    blog_id INTEGER NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建博客浏览记录表索引
CREATE INDEX idx_blog_views_blog_id ON blog_views(blog_id);
CREATE INDEX idx_blog_views_ip_created ON blog_views(ip_address, created_at);
CREATE INDEX idx_blog_views_created_at ON blog_views(created_at);

-- 添加评论表注释
COMMENT ON TABLE blog_views IS '博客浏览记录表（用于IP限制）';

-- 添加浏览记录表字段注释
COMMENT ON COLUMN blog_views.blog_id IS '关联的博客ID';
COMMENT ON COLUMN blog_views.ip_address IS '浏览者IP地址';
COMMENT ON COLUMN blog_views.user_agent IS '用户代理信息';

-- ================================================
-- 富媒体动态模块表结构
-- ================================================

-- 创建动态表
CREATE TABLE moments (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    author_id VARCHAR(50) DEFAULT 'admin',
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'draft')),
    images TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建动态模块索引
CREATE INDEX idx_moments_created_at ON moments(created_at DESC);
CREATE INDEX idx_moments_visibility ON moments(visibility);
CREATE INDEX idx_moments_author_id ON moments(author_id);

-- 为动态模块表创建更新时间触发器
CREATE TRIGGER update_moments_updated_at 
    BEFORE UPDATE ON moments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 添加动态模块表注释
COMMENT ON TABLE moments IS '动态主表';

-- 添加动态表字段注释
COMMENT ON COLUMN moments.content IS '动态文字内容';
COMMENT ON COLUMN moments.author_id IS '作者ID';
COMMENT ON COLUMN moments.visibility IS '可见性(public/private/draft)';
COMMENT ON COLUMN moments.images IS '图片URL列表（逗号分隔）';

-- ================================================
-- OpenClaw 每日汇报表
-- ================================================

CREATE TABLE IF NOT EXISTS openclaw_daily_reports (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL DEFAULT 'openclaw',
    report_date DATE NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'warning', 'error')),
    tasks JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (source, report_date)
);

CREATE INDEX idx_openclaw_daily_reports_date ON openclaw_daily_reports(report_date DESC);
CREATE INDEX idx_openclaw_daily_reports_source ON openclaw_daily_reports(source);
CREATE INDEX idx_openclaw_daily_reports_status ON openclaw_daily_reports(status);

CREATE TRIGGER update_openclaw_daily_reports_updated_at 
    BEFORE UPDATE ON openclaw_daily_reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE openclaw_daily_reports IS 'OpenClaw 每日任务汇报';
COMMENT ON COLUMN openclaw_daily_reports.source IS '来源系统标识（默认 openclaw）';
COMMENT ON COLUMN openclaw_daily_reports.report_date IS '汇报日期';
COMMENT ON COLUMN openclaw_daily_reports.content IS '汇报正文（支持 Markdown）';
COMMENT ON COLUMN openclaw_daily_reports.tasks IS '任务列表（JSON数组）';
COMMENT ON COLUMN openclaw_daily_reports.metadata IS '扩展元数据';

-- ================================================
-- 系统日志模块表结构
-- ================================================

-- 系统日志表
CREATE TABLE system_logs (
    id BIGSERIAL PRIMARY KEY,
    log_type VARCHAR(50) NOT NULL,
    level VARCHAR(20) NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')),
    module VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    user_id BIGINT REFERENCES users(id),
    username VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    request_method VARCHAR(10),
    request_url TEXT,
    request_params JSONB,
    response_status INTEGER,
    execution_time INTEGER,
    error_message TEXT,
    error_stack TEXT,
    extra_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    request_data JSONB,
    response_data JSONB
);

-- 创建系统日志表索引
CREATE INDEX idx_system_logs_log_type ON system_logs(log_type);
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_module ON system_logs(module);
CREATE INDEX idx_system_logs_action ON system_logs(action);
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX idx_system_logs_ip_address ON system_logs(ip_address);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX idx_system_logs_type_level ON system_logs(log_type, level);
CREATE INDEX idx_system_logs_module_action ON system_logs(module, action);

-- 添加系统日志表注释
COMMENT ON TABLE system_logs IS '系统日志表';

-- 添加系统日志表字段注释
COMMENT ON COLUMN system_logs.log_type IS '日志类型(request/error/system/security)';
COMMENT ON COLUMN system_logs.level IS '日志级别(debug/info/warn/error/fatal，支持大小写)';
COMMENT ON COLUMN system_logs.module IS '模块名称';
COMMENT ON COLUMN system_logs.action IS '操作动作';
COMMENT ON COLUMN system_logs.description IS '日志描述';
COMMENT ON COLUMN system_logs.user_id IS '关联用户ID';
COMMENT ON COLUMN system_logs.ip_address IS 'IP地址';
COMMENT ON COLUMN system_logs.user_agent IS '用户代理信息';
COMMENT ON COLUMN system_logs.request_data IS '请求数据(JSON格式)';
COMMENT ON COLUMN system_logs.response_data IS '响应数据(JSON格式)';
COMMENT ON COLUMN system_logs.error_message IS '错误信息';
COMMENT ON COLUMN system_logs.execution_time IS '执行时间(毫秒)';
COMMENT ON COLUMN system_logs.created_at IS '创建时间';

-- ================================================
-- 摄影模块表结构
-- ================================================

-- 创建照片表
CREATE TABLE photos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    category VARCHAR(50),
    location VARCHAR(255),
    taken_at DATE,
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建照片表索引
CREATE INDEX idx_photos_category ON photos(category);
CREATE INDEX idx_photos_published ON photos(published);
CREATE INDEX idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX idx_photos_taken_at ON photos(taken_at DESC);

-- 为照片表创建更新时间触发器
CREATE TRIGGER update_photos_updated_at 
    BEFORE UPDATE ON photos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 添加照片表注释
COMMENT ON TABLE photos IS '摄影作品表';
COMMENT ON COLUMN photos.title IS '照片标题';
COMMENT ON COLUMN photos.description IS '照片描述';
COMMENT ON COLUMN photos.image_url IS '原图链接';
COMMENT ON COLUMN photos.thumbnail_url IS '缩略图链接';
COMMENT ON COLUMN photos.category IS '照片分类';
COMMENT ON COLUMN photos.location IS '拍摄地点';
COMMENT ON COLUMN photos.taken_at IS '拍摄日期';
COMMENT ON COLUMN photos.published IS '是否发布';

-- ================================================
-- 通用浏览记录模块表结构
-- ================================================

-- 创建通用浏览记录表
CREATE TABLE view_logs (
    id SERIAL PRIMARY KEY,
    target_type VARCHAR(20) NOT NULL, -- 'blog', 'moment', 'work', 'page'
    target_id INTEGER NOT NULL DEFAULT 0,
    ip_address INET NOT NULL,
    ip_location VARCHAR(100), -- IP所属地区
    user_agent TEXT,
    path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_view_logs_target ON view_logs(target_type, target_id);
CREATE INDEX idx_view_logs_ip ON view_logs(ip_address);
CREATE INDEX idx_view_logs_created_at ON view_logs(created_at DESC);

-- 添加注释
COMMENT ON TABLE view_logs IS '通用浏览记录日志表';
COMMENT ON COLUMN view_logs.target_type IS '目标类型(blog/moment/work/page)';
COMMENT ON COLUMN view_logs.target_id IS '目标ID';
COMMENT ON COLUMN view_logs.ip_address IS '访客IP';
COMMENT ON COLUMN view_logs.ip_location IS 'IP所属地区';
COMMENT ON COLUMN view_logs.path IS '访问路径';
COMMENT ON COLUMN view_logs.created_at IS '访问时间';

-- 显示创建结果
SELECT 'Tables created successfully!' as result;
