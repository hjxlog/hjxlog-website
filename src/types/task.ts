// 任务和项目的共享类型定义

export interface Task {
  id: number;
  title: string;
  description: string;
  project_id: number | null;
  status: 'todo' | 'in_progress' | 'done' | 'cancelled';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  tags: string[];
  start_date: string | null;
  due_date: string | null;
  project_name?: string;
  project_color?: string;
  project_icon?: string;
  parent_task_id?: number;
  source_thought_id?: number;
  position?: number;
  estimated_hours?: number;
  actual_hours?: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  color: string;
  icon: string;
  status: 'active' | 'archived' | 'completed';
  task_count?: number;
  completed_count?: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface SubTask {
  id: number;
  title: string;
  completed: boolean;
}

export interface TaskComment {
  id: number;
  task_id: number;
  content: string;
  created_at: string;
  created_by: number;
}

export interface TaskTimeLog {
  id: number;
  task_id: number;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  note: string;
  created_at: string;
}

export interface TaskOverviewStats {
  total: number;
  todo: number;
  in_progress: number;
  done: number;
  cancelled: number;
  p0: number;
  p1: number;
  overdue: number;
}

export type ViewType = 'kanban' | 'list' | 'calendar' | 'today';
