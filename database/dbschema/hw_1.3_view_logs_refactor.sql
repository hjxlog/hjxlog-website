-- view_logs 重构（小流量版）
-- 目标：保留旧表，补充访客标识、去重键、机器人标记与IP质量字段

ALTER TABLE view_logs
  ADD COLUMN IF NOT EXISTS visitor_id UUID,
  ADD COLUMN IF NOT EXISTS visitor_fallback_hash CHAR(64),
  ADD COLUMN IF NOT EXISTS ip_quality VARCHAR(20) NOT NULL DEFAULT 'placeholder',
  ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dedupe_key CHAR(64),
  ADD COLUMN IF NOT EXISTS accepted BOOLEAN NOT NULL DEFAULT true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_view_logs_ip_quality'
  ) THEN
    ALTER TABLE view_logs
      ADD CONSTRAINT chk_view_logs_ip_quality
      CHECK (ip_quality IN ('public', 'placeholder'));
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_view_logs_target_created
  ON view_logs(target_type, target_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_view_logs_visitor_created
  ON view_logs(visitor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_view_logs_is_bot_created
  ON view_logs(is_bot, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_view_logs_dedupe_key_uniq
  ON view_logs(dedupe_key)
  WHERE dedupe_key IS NOT NULL;
