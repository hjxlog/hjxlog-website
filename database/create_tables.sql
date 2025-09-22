-- ================================================
-- HJXLog 博客系统数据库表结构
-- 数据库: hjxlog
-- 用户: postgres
-- 密码: 12345678
-- ================================================

-- 删除已存在的表（如果存在）

DROP TABLE IF EXISTS moment_likes CASCADE;
DROP TABLE IF EXISTS moment_comments CASCADE;
DROP TABLE IF EXISTS moments CASCADE;
DROP TABLE IF EXISTS blog_views CASCADE;
DROP TABLE IF EXISTS blog_likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS blogs CASCADE;
DROP TABLE IF EXISTS works CASCADE;
DROP TABLE IF EXISTS users CASCADE;

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
    likes INTEGER DEFAULT 0,
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
COMMENT ON COLUMN blogs.likes IS '点赞次数';
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



-- 创建评论表
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    blog_id INTEGER NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    author_name VARCHAR(100) NOT NULL,
    author_email VARCHAR(100),
    content TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'approved',
    admin_reply TEXT,
    admin_reply_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建点赞记录表（用于IP限制）
CREATE TABLE blog_likes (
    id SERIAL PRIMARY KEY,
    blog_id INTEGER NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建博客浏览记录表（用于IP限制）
CREATE TABLE blog_views (
    id SERIAL PRIMARY KEY,
    blog_id INTEGER NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建评论表索引
CREATE INDEX idx_comments_blog_id ON comments(blog_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_comments_status ON comments(status);

-- 创建点赞记录表索引
CREATE INDEX idx_blog_likes_blog_id ON blog_likes(blog_id);
CREATE INDEX idx_blog_likes_ip_created ON blog_likes(ip_address, created_at);
CREATE INDEX idx_blog_likes_created_at ON blog_likes(created_at);

-- 创建博客浏览记录表索引
CREATE INDEX idx_blog_views_blog_id ON blog_views(blog_id);
CREATE INDEX idx_blog_views_ip_created ON blog_views(ip_address, created_at);
CREATE INDEX idx_blog_views_created_at ON blog_views(created_at);

-- 为评论表创建更新时间触发器
CREATE TRIGGER update_comments_updated_at 
    BEFORE UPDATE ON comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 添加评论表注释
COMMENT ON TABLE comments IS '博客评论表';
COMMENT ON TABLE blog_likes IS '博客点赞记录表（用于IP限制）';
COMMENT ON TABLE blog_views IS '博客浏览记录表（用于IP限制）';

-- 添加评论表字段注释
COMMENT ON COLUMN comments.blog_id IS '关联的博客ID';
COMMENT ON COLUMN comments.parent_id IS '父评论ID（用于回复功能）';
COMMENT ON COLUMN comments.author_name IS '评论者姓名';
COMMENT ON COLUMN comments.author_email IS '评论者邮箱';
COMMENT ON COLUMN comments.content IS '评论内容';
COMMENT ON COLUMN comments.ip_address IS '评论者IP地址';
COMMENT ON COLUMN comments.user_agent IS '用户代理信息';
COMMENT ON COLUMN comments.status IS '评论状态(pending/approved/rejected)';
COMMENT ON COLUMN comments.admin_reply IS '管理员回复内容';
COMMENT ON COLUMN comments.admin_reply_at IS '管理员回复时间';

-- 添加点赞记录表字段注释
COMMENT ON COLUMN blog_likes.blog_id IS '关联的博客ID';
COMMENT ON COLUMN blog_likes.ip_address IS '点赞者IP地址';
COMMENT ON COLUMN blog_likes.user_agent IS '用户代理信息';

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
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);



-- 创建动态评论表
CREATE TABLE moment_comments (
    id SERIAL PRIMARY KEY,
    moment_id INTEGER NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES moment_comments(id) ON DELETE CASCADE,
    author_name VARCHAR(100) NOT NULL,
    author_email VARCHAR(100),
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    ip_address INET,
    user_agent TEXT,
    admin_reply TEXT,
    admin_reply_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建动态点赞表
CREATE TABLE moment_likes (
    id SERIAL PRIMARY KEY,
    moment_id INTEGER NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(moment_id, ip_address)
);

-- 创建动态模块索引
CREATE INDEX idx_moments_created_at ON moments(created_at DESC);
CREATE INDEX idx_moments_visibility ON moments(visibility);
CREATE INDEX idx_moments_author_id ON moments(author_id);



CREATE INDEX idx_moment_comments_moment_id ON moment_comments(moment_id);
CREATE INDEX idx_moment_comments_parent_id ON moment_comments(parent_id);
CREATE INDEX idx_moment_comments_status ON moment_comments(status);
CREATE INDEX idx_moment_comments_created_at ON moment_comments(created_at DESC);

CREATE INDEX idx_moment_likes_moment_id ON moment_likes(moment_id);
CREATE INDEX idx_moment_likes_ip_address ON moment_likes(ip_address);
CREATE INDEX idx_moment_likes_created_at ON moment_likes(created_at DESC);

-- 为动态模块表创建更新时间触发器
CREATE TRIGGER update_moments_updated_at 
    BEFORE UPDATE ON moments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_moment_comments_updated_at 
    BEFORE UPDATE ON moment_comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 添加动态模块表注释
COMMENT ON TABLE moments IS '动态主表';

COMMENT ON TABLE moment_comments IS '动态评论表';
COMMENT ON TABLE moment_likes IS '动态点赞记录表';

-- 添加动态表字段注释
COMMENT ON COLUMN moments.content IS '动态文字内容';
COMMENT ON COLUMN moments.author_id IS '作者ID';
COMMENT ON COLUMN moments.visibility IS '可见性(public/private/draft)';
COMMENT ON COLUMN moments.images IS '图片URL列表（逗号分隔）';
COMMENT ON COLUMN moments.likes_count IS '点赞数量';
COMMENT ON COLUMN moments.comments_count IS '评论数量';



-- 添加动态评论表字段注释
COMMENT ON COLUMN moment_comments.moment_id IS '关联的动态ID';
COMMENT ON COLUMN moment_comments.parent_id IS '父评论ID（用于回复功能）';
COMMENT ON COLUMN moment_comments.author_name IS '评论者姓名';
COMMENT ON COLUMN moment_comments.author_email IS '评论者邮箱';
COMMENT ON COLUMN moment_comments.content IS '评论内容';
COMMENT ON COLUMN moment_comments.status IS '评论状态(pending/approved/rejected)';
COMMENT ON COLUMN moment_comments.ip_address IS '评论者IP地址';
COMMENT ON COLUMN moment_comments.user_agent IS '用户代理信息';
COMMENT ON COLUMN moment_comments.admin_reply IS '管理员回复内容';
COMMENT ON COLUMN moment_comments.admin_reply_at IS '管理员回复时间';

-- 添加动态点赞表字段注释
COMMENT ON COLUMN moment_likes.moment_id IS '关联的动态ID';
COMMENT ON COLUMN moment_likes.ip_address IS '点赞者IP地址';
COMMENT ON COLUMN moment_likes.user_agent IS '用户代理信息';

-- 插入示例动态数据
INSERT INTO moments (content, author_id, visibility) VALUES 
('欢迎来到我的动态空间！这里会分享一些日常的想法和有趣的内容。', 'admin', 'public'),
('今天学习了新的技术栈，感觉收获满满！', 'admin', 'public'),
('分享一些最近拍摄的照片，希望大家喜欢。', 'admin', 'public');



-- ================================================
-- 系统日志模块表结构
-- ================================================

-- 创建系统日志表
CREATE TABLE system_logs (
    id SERIAL PRIMARY KEY,
    log_type VARCHAR(20) NOT NULL CHECK (log_type IN ('operation', 'error', 'security', 'system')),
    level VARCHAR(10) NOT NULL DEFAULT 'info' CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
    module VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    user_id VARCHAR(50),
    username VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    request_method VARCHAR(10),
    request_url TEXT,
    request_params JSONB,
    response_status INTEGER,
    response_time INTEGER,
    error_message TEXT,
    error_stack TEXT,
    extra_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建系统日志表索引
CREATE INDEX idx_system_logs_log_type ON system_logs(log_type);
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_module ON system_logs(module);
CREATE INDEX idx_system_logs_action ON system_logs(action);
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX idx_system_logs_ip_address ON system_logs(ip_address);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX idx_system_logs_response_status ON system_logs(response_status);
CREATE INDEX idx_system_logs_type_level ON system_logs(log_type, level);
CREATE INDEX idx_system_logs_module_action ON system_logs(module, action);

-- 添加系统日志表注释
COMMENT ON TABLE system_logs IS '系统日志表';

-- 添加系统日志表字段注释
COMMENT ON COLUMN system_logs.log_type IS '日志类型(operation/error/security/system)';
COMMENT ON COLUMN system_logs.level IS '日志级别(debug/info/warn/error/fatal)';
COMMENT ON COLUMN system_logs.module IS '模块名称';
COMMENT ON COLUMN system_logs.action IS '操作动作';
COMMENT ON COLUMN system_logs.description IS '操作描述';
COMMENT ON COLUMN system_logs.user_id IS '用户ID';
COMMENT ON COLUMN system_logs.username IS '用户名';
COMMENT ON COLUMN system_logs.ip_address IS 'IP地址';
COMMENT ON COLUMN system_logs.user_agent IS '用户代理信息';
COMMENT ON COLUMN system_logs.request_method IS '请求方法';
COMMENT ON COLUMN system_logs.request_url IS '请求URL';
COMMENT ON COLUMN system_logs.request_params IS '请求参数(JSON格式)';
COMMENT ON COLUMN system_logs.response_status IS '响应状态码';
COMMENT ON COLUMN system_logs.response_time IS '响应时间(毫秒)';
COMMENT ON COLUMN system_logs.error_message IS '错误信息';
COMMENT ON COLUMN system_logs.error_stack IS '错误堆栈';
COMMENT ON COLUMN system_logs.extra_data IS '额外数据(JSON格式)';
COMMENT ON COLUMN system_logs.created_at IS '创建时间';

-- 显示创建结果
SELECT 'Tables created successfully!' as result;