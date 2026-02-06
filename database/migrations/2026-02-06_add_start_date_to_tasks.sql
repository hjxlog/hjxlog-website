-- 为 Task Force 增加任务开始时间字段（用于日历区间拖拽）
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN tasks.start_date IS '任务开始时间';
