-- Add structured content fields for Notion-like task editor

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS content_json JSONB;

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS content_version INTEGER DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_tasks_content_version ON tasks(content_version);
