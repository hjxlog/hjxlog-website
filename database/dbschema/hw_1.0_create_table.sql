-- HJXLog Database Schema v1.0
-- First-time setup entrypoint:
--   database/dbschema/hw_1.0_create_table.sql
-- This script is idempotent and can be executed multiple times safely.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Core user/content
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blogs (
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

CREATE TABLE IF NOT EXISTS works (
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

CREATE TABLE IF NOT EXISTS moments (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  author_id VARCHAR(50) DEFAULT 'admin',
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'draft')),
  images TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS photos (
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

CREATE TABLE IF NOT EXISTS blog_views (
  id SERIAL PRIMARY KEY,
  blog_id INTEGER NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS view_logs (
  id SERIAL PRIMARY KEY,
  target_type VARCHAR(20) NOT NULL,
  target_id INTEGER NOT NULL DEFAULT 0,
  ip_address INET NOT NULL,
  ip_location VARCHAR(100),
  user_agent TEXT,
  path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS system_logs (
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

-- Task force
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6366f1',
  icon VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled')),
  priority VARCHAR(10) DEFAULT 'P2' CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),
  tags TEXT[] DEFAULT '{}',
  start_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  parent_task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  source_thought_id INTEGER,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS task_comments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS task_time_logs (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Memory
CREATE TABLE IF NOT EXISTS daily_thoughts (
  id SERIAL PRIMARY KEY,
  thought_date DATE UNIQUE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- External API token
CREATE TABLE IF NOT EXISTS external_api_tokens (
  id SERIAL PRIMARY KEY,
  token VARCHAR(255) UNIQUE,
  token_hash VARCHAR(64) UNIQUE,
  token_prefix VARCHAR(20),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  source VARCHAR(50) NOT NULL,
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

-- AI sources/signal
CREATE TABLE IF NOT EXISTS ai_sources (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  rss_url TEXT,
  type VARCHAR(30) NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_source_weights (
  id SERIAL PRIMARY KEY,
  source_id INTEGER NOT NULL REFERENCES ai_sources(id) ON DELETE CASCADE,
  category VARCHAR(30) NOT NULL,
  weight NUMERIC(4,3) NOT NULL DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (source_id, category)
);

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

CREATE TABLE IF NOT EXISTS ai_daily_digests (
  id SERIAL PRIMARY KEY,
  digest_date DATE NOT NULL UNIQUE,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'ready',
  summary_text TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  empty_reason TEXT,
  source_window_days INTEGER NOT NULL DEFAULT 3,
  max_items INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

-- AI chat/RAG
CREATE TABLE IF NOT EXISTS knowledge_base (
  id SERIAL PRIMARY KEY,
  source_type VARCHAR(50) NOT NULL,
  source_id INTEGER,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding vector(1024),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(100) UNIQUE NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prompt_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  scenario VARCHAR(50) NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  system_prompt TEXT,
  user_prompt_template TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_rate_limits (
  id SERIAL PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  request_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (ip_address, request_date)
);

CREATE TABLE IF NOT EXISTS chat_global_usage (
  id SERIAL PRIMARY KEY,
  request_date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  total_requests INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs(category);
CREATE INDEX IF NOT EXISTS idx_blogs_published ON blogs(published);
CREATE INDEX IF NOT EXISTS idx_blogs_featured ON blogs(featured);
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_author ON blogs(author);
CREATE INDEX IF NOT EXISTS idx_works_category ON works(category);
CREATE INDEX IF NOT EXISTS idx_works_status ON works(status);
CREATE INDEX IF NOT EXISTS idx_works_featured ON works(featured);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_blog_views_blog_id ON blog_views(blog_id);
CREATE INDEX IF NOT EXISTS idx_blog_views_ip_created ON blog_views(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_blog_views_created_at ON blog_views(created_at);

CREATE INDEX IF NOT EXISTS idx_moments_created_at ON moments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moments_visibility ON moments(visibility);
CREATE INDEX IF NOT EXISTS idx_moments_author_id ON moments(author_id);

CREATE INDEX IF NOT EXISTS idx_openclaw_daily_reports_date ON openclaw_daily_reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_openclaw_daily_reports_source ON openclaw_daily_reports(source);
CREATE INDEX IF NOT EXISTS idx_openclaw_daily_reports_status ON openclaw_daily_reports(status);

CREATE INDEX IF NOT EXISTS idx_system_logs_log_type ON system_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_module ON system_logs(module);
CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_ip_address ON system_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_type_level ON system_logs(log_type, level);
CREATE INDEX IF NOT EXISTS idx_system_logs_module_action ON system_logs(module, action);

CREATE INDEX IF NOT EXISTS idx_photos_category ON photos(category);
CREATE INDEX IF NOT EXISTS idx_photos_published ON photos(published);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_taken_at ON photos(taken_at DESC);

CREATE INDEX IF NOT EXISTS idx_view_logs_target ON view_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_view_logs_ip ON view_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_view_logs_created_at ON view_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_daily_thoughts_date ON daily_thoughts(thought_date DESC);

CREATE INDEX IF NOT EXISTS idx_external_api_tokens_token ON external_api_tokens(token);
CREATE INDEX IF NOT EXISTS idx_external_api_tokens_token_hash ON external_api_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_external_api_tokens_source ON external_api_tokens(source);
CREATE INDEX IF NOT EXISTS idx_external_api_tokens_scopes ON external_api_tokens USING GIN (scopes);
CREATE INDEX IF NOT EXISTS idx_external_api_tokens_is_active ON external_api_tokens(is_active);

CREATE INDEX IF NOT EXISTS idx_ai_sources_url ON ai_sources(url);
CREATE INDEX IF NOT EXISTS idx_ai_source_items_source_id ON ai_source_items(source_id);
CREATE INDEX IF NOT EXISTS idx_ai_source_items_published_at ON ai_source_items(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_daily_digests_date ON ai_daily_digests(digest_date DESC);

CREATE INDEX IF NOT EXISTS idx_kb_source_type ON knowledge_base(source_type);
CREATE INDEX IF NOT EXISTS idx_kb_source_id ON knowledge_base(source_id);
CREATE INDEX IF NOT EXISTS idx_kb_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_prompt_templates_scenario ON prompt_templates(scenario);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_active ON prompt_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_updated ON prompt_templates(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_rate_limits_ip_date ON chat_rate_limits(ip_address, request_date);
CREATE INDEX IF NOT EXISTS idx_chat_global_usage_date ON chat_global_usage(request_date);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_blogs_updated_at ON blogs;
CREATE TRIGGER trg_blogs_updated_at BEFORE UPDATE ON blogs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_works_updated_at ON works;
CREATE TRIGGER trg_works_updated_at BEFORE UPDATE ON works FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_moments_updated_at ON moments;
CREATE TRIGGER trg_moments_updated_at BEFORE UPDATE ON moments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_photos_updated_at ON photos;
CREATE TRIGGER trg_photos_updated_at BEFORE UPDATE ON photos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_openclaw_daily_reports_updated_at ON openclaw_daily_reports;
CREATE TRIGGER trg_openclaw_daily_reports_updated_at BEFORE UPDATE ON openclaw_daily_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;
CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_daily_thoughts_updated_at ON daily_thoughts;
CREATE TRIGGER trg_daily_thoughts_updated_at BEFORE UPDATE ON daily_thoughts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_external_api_tokens_updated_at ON external_api_tokens;
CREATE TRIGGER trg_external_api_tokens_updated_at BEFORE UPDATE ON external_api_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ai_sources_updated_at ON ai_sources;
CREATE TRIGGER trg_ai_sources_updated_at BEFORE UPDATE ON ai_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ai_source_weights_updated_at ON ai_source_weights;
CREATE TRIGGER trg_ai_source_weights_updated_at BEFORE UPDATE ON ai_source_weights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ai_source_items_updated_at ON ai_source_items;
CREATE TRIGGER trg_ai_source_items_updated_at BEFORE UPDATE ON ai_source_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ai_daily_digests_updated_at ON ai_daily_digests;
CREATE TRIGGER trg_ai_daily_digests_updated_at BEFORE UPDATE ON ai_daily_digests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ai_user_opinions_updated_at ON ai_user_opinions;
CREATE TRIGGER trg_ai_user_opinions_updated_at BEFORE UPDATE ON ai_user_opinions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_knowledge_base_updated_at ON knowledge_base;
CREATE TRIGGER trg_knowledge_base_updated_at BEFORE UPDATE ON knowledge_base FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER trg_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_prompt_templates_updated_at ON prompt_templates;
CREATE TRIGGER trg_prompt_templates_updated_at BEFORE UPDATE ON prompt_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_chat_rate_limits_updated_at ON chat_rate_limits;
CREATE TRIGGER trg_chat_rate_limits_updated_at BEFORE UPDATE ON chat_rate_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_chat_global_usage_updated_at ON chat_global_usage;
CREATE TRIGGER trg_chat_global_usage_updated_at BEFORE UPDATE ON chat_global_usage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
