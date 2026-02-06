-- ================================================
-- Task Force 功能 - 数据库表结构
-- 创建日期: 2026-02-05
-- 说明: 任务/项目管理系统
-- ================================================

-- 项目表
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',  -- 项目颜色
    icon VARCHAR(50),  -- 项目图标
    status VARCHAR(20) DEFAULT 'active',  -- active, archived, completed
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 任务表
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'todo',  -- todo, in_progress, done, cancelled
    priority VARCHAR(10) DEFAULT 'P2',  -- P0, P1, P2, P3
    tags TEXT[] DEFAULT '{}',
    start_date TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    parent_task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,  -- 子任务
    source_thought_id INTEGER,  -- 关联的想法ID
    position INTEGER DEFAULT 0,  -- 看板列中的排序位置
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER DEFAULT 1
);

-- 任务评论表
CREATE TABLE IF NOT EXISTS task_comments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER DEFAULT 1
);

-- 任务时间记录表
CREATE TABLE IF NOT EXISTS task_time_logs (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- 创建更新时间触发器
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 添加注释
COMMENT ON TABLE projects IS '项目表';
COMMENT ON TABLE tasks IS '任务表';
COMMENT ON TABLE task_comments IS '任务评论表';
COMMENT ON TABLE task_time_logs IS '任务时间记录表';

COMMENT ON COLUMN tasks.source_thought_id IS '关联的每日想法ID';
COMMENT ON COLUMN tasks.position IS '看板视图中的排序位置';
COMMENT ON COLUMN tasks.start_date IS '任务开始时间';
COMMENT ON COLUMN tasks.estimated_hours IS '预估工时（小时）';
COMMENT ON COLUMN tasks.actual_hours IS '实际工时（小时）';

-- 插入示例数据
INSERT INTO projects (name, description, color, icon) VALUES
    ('个人网站优化', '持续优化 hjxlog-website', '#6366f1', 'globe'),
    ('学习计划', '技术学习和技能提升', '#10b981', 'book'),
    ('生活事务', '日常待办事项', '#f59e0b', 'home');

INSERT INTO tasks (title, description, project_id, status, priority, due_date) VALUES
    ('实现任务管理功能', '设计并实现Task Force模块', 1, 'in_progress', 'P1', '2026-02-10'),
    ('学习 Rust 基础', '完成 Rustlings 练习', 2, 'todo', 'P2', '2026-02-15'),
    ('购买日用品', '牛奶、面包、水果', 3, 'todo', 'P3', '2026-02-06');

SELECT 'Task Force tables created successfully!' as result;
