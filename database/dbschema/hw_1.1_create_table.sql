-- Add daily_reports table for AI-generated daily summaries

CREATE TABLE IF NOT EXISTS daily_reports (
  id SERIAL PRIMARY KEY,
  report_date DATE UNIQUE NOT NULL,
  content TEXT NOT NULL,
  source_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date DESC);

DROP TRIGGER IF EXISTS trg_daily_reports_updated_at ON daily_reports;
CREATE TRIGGER trg_daily_reports_updated_at BEFORE UPDATE ON daily_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
