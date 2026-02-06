-- OpenClaw 每日汇报表

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

CREATE INDEX IF NOT EXISTS idx_openclaw_daily_reports_date ON openclaw_daily_reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_openclaw_daily_reports_source ON openclaw_daily_reports(source);
CREATE INDEX IF NOT EXISTS idx_openclaw_daily_reports_status ON openclaw_daily_reports(status);

DROP TRIGGER IF EXISTS update_openclaw_daily_reports_updated_at ON openclaw_daily_reports;
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
