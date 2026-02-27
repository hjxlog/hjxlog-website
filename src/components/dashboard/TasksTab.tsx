import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PlusIcon } from '@heroicons/react/24/outline';
import { apiRequest } from '@/config/api';
import { useShortcut } from '@/hooks/useShortcut';
import TaskKanban from '@/components/tasks/TaskKanban';
import TaskList from '@/components/tasks/TaskList';
import TaskFilters from '@/components/tasks/TaskFilters';
import TaskStats from '@/components/tasks/TaskStats';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';
import CreateProjectModal from '@/components/tasks/CreateProjectModal';
import QuickAddModal from '@/components/tasks/QuickAddModal';
import TaskCalendar from '@/components/tasks/TaskCalendar';
import TaskTodayView from '@/components/tasks/TaskTodayView';
import TaskDetailSidebar from '@/components/tasks/TaskDetailSidebar';
import { Task, Project, ViewType } from '@/types/task';
import { parseTaskDate } from '@/utils/taskDate';

export default function TasksTab() {
  const [view, setView] = useState<ViewType>('calendar');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    project_id: null as number | null,
    status: null as string | null,
    priority: null as string | null,
    search: ''
  });
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createTaskInitialData, setCreateTaskInitialData] = useState<{ start_date?: string; due_date?: string } | null>(null);
  const [lastSelectedProjectId, setLastSelectedProjectId] = useState<number | null>(null);

  const parseLocalDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, (month || 1) - 1, day || 1);
  };

  const toLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTaskRange = (task: Task) => {
    const startRaw = task.start_date || task.due_date;
    const endRaw = task.due_date || task.start_date;
    if (!startRaw && !endRaw) return null;
    const startDate = parseTaskDate(startRaw || endRaw || '');
    const endDate = parseTaskDate(endRaw || startRaw || '');
    if (!startDate || !endDate) return null;
    const normalizedStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const normalizedEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    return normalizedStart <= normalizedEnd
      ? { start: normalizedStart, end: normalizedEnd }
      : { start: normalizedEnd, end: normalizedStart };
  };

  const fetchProjects = async () => {
    try {
      const data = await apiRequest('/api/tasks/projects') as { success: boolean; data: Project[] };
      setProjects(data.data || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const fetchTasks = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const params = new URLSearchParams();
      if (filters.project_id) params.append('project_id', filters.project_id.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);

      const data = await apiRequest(`/api/tasks?${params}`) as { success: boolean; data: Task[] };
      setTasks(data.data || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error('获取任务列表失败');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiRequest('/api/tasks/stats/overview') as { success: boolean; data: any };
      setStats(data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  useShortcut('cmd+k', () => {
    setShowQuickAdd(true);
  });

  const refreshTaskAndStats = useCallback(async () => {
    await Promise.all([fetchTasks(false), fetchStats()]);
  }, [fetchTasks, fetchStats]);

  const handleCreateTask = async (taskData: any) => {
    try {
      const cleanedData = {
        ...taskData,
        project_id: taskData.project_id || null
      };
      await apiRequest('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(cleanedData)
      });
      toast.success('任务创建成功');
      setShowCreateTask(false);
      fetchTasks(false);
      fetchStats();
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('创建任务失败');
    }
  };

  const handleCreateProject = async (projectData: any) => {
    try {
      await apiRequest('/api/tasks/projects', {
        method: 'POST',
        body: JSON.stringify(projectData)
      });
      toast.success('项目创建成功');
      setShowCreateProject(false);
      fetchProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('创建项目失败');
    }
  };

  const handleMoveTask = async (task: Task, targetDate: string) => {
    try {
      const range = getTaskRange(task);
      if (!range) return;
      const target = parseLocalDate(targetDate);
      const durationDays = Math.max(0, Math.round((range.end.getTime() - range.start.getTime()) / (24 * 60 * 60 * 1000)));
      const nextStart = target;
      const nextEnd = new Date(target);
      nextEnd.setDate(nextEnd.getDate() + durationDays);

      await apiRequest(`/api/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          start_date: toLocalDateString(nextStart),
          due_date: toLocalDateString(nextEnd)
        })
      });
      toast.success('任务日期已更新');
      fetchTasks();
      fetchStats();
    } catch (error) {
      console.error('Failed to move task:', error);
      toast.error('移动任务失败');
    }
  };

  const handleResizeTask = async (task: Task, targetDate: string) => {
    try {
      const range = getTaskRange(task);
      if (!range) return;
      const target = parseLocalDate(targetDate);
      const start = range.start;
      const nextEnd = target < start ? start : target;

      await apiRequest(`/api/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          start_date: toLocalDateString(start),
          due_date: toLocalDateString(nextEnd)
        })
      });
      toast.success('任务截止日期已更新');
      fetchTasks();
      fetchStats();
    } catch (error) {
      console.error('Failed to resize task:', error);
      toast.error('调整截止日期失败');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">待办事项</h3>
              <p className="text-xs sm:text-sm text-slate-500">任务与项目管理</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateProject(true)}
                className="px-2.5 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                新建项目
              </button>
              <button
                onClick={() => {
                  setCreateTaskInitialData(null);
                  setShowCreateTask(true);
                }}
                className="px-2.5 py-1.5 text-sm font-medium text-white bg-[#165DFF] rounded-lg hover:bg-[#0E4BA4] transition-colors flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                新建任务
              </button>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-2.5">
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setView('calendar')}
                className={`shrink-0 whitespace-nowrap px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  view === 'calendar'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                日历
              </button>
              <button
                onClick={() => setView('kanban')}
                className={`shrink-0 whitespace-nowrap px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  view === 'kanban'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                看板
              </button>
              <button
                onClick={() => setView('list')}
                className={`shrink-0 whitespace-nowrap px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  view === 'list'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                列表
              </button>
              <button
                onClick={() => setView('today')}
                className={`shrink-0 whitespace-nowrap px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  view === 'today'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                今天
              </button>
            </div>
            <TaskFilters projects={projects} filters={filters} onFiltersChange={setFilters} />
          </div>
        </div>
      </div>

      {stats && <TaskStats stats={stats} />}

      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 min-h-[300px] relative">
        {loading && tasks.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#165DFF]"></div>
          </div>
        ) : (
          <>
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 rounded-2xl">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#165DFF]"></div>
              </div>
            )}
            {view === 'kanban' && <TaskKanban tasks={tasks} projects={projects} onUpdate={refreshTaskAndStats} />}
            {view === 'list' && <TaskList tasks={tasks} projects={projects} onUpdate={refreshTaskAndStats} />}
            {view === 'calendar' && (
              <TaskCalendar
                tasks={tasks}
                onTaskClick={setSelectedTask}
                onCreateForDate={(date) => {
                  setCreateTaskInitialData({ start_date: date, due_date: date });
                  setShowCreateTask(true);
                }}
                onMoveTask={handleMoveTask}
                onResizeTask={handleResizeTask}
              />
            )}
            {view === 'today' && (
              <TaskTodayView
                tasks={tasks}
                onTaskClick={setSelectedTask}
              />
            )}
          </>
        )}
      </div>

      {showCreateTask && (
        <CreateTaskModal
          projects={projects}
          onClose={() => {
            setShowCreateTask(false);
            setCreateTaskInitialData(null);
          }}
          onSubmit={(taskData) => {
            if (typeof taskData.project_id === 'number') {
              setLastSelectedProjectId(taskData.project_id);
            }
            handleCreateTask(taskData);
          }}
          onProjectChange={(projectId) => {
            if (typeof projectId === 'number' && !Number.isNaN(projectId)) {
              setLastSelectedProjectId(projectId);
            }
          }}
          initialTask={{
            ...createTaskInitialData,
            project_id: projects.some(project => project.id === lastSelectedProjectId)
              ? lastSelectedProjectId ?? undefined
              : undefined
          }}
        />
      )}

      {showCreateProject && (
        <CreateProjectModal
          onClose={() => setShowCreateProject(false)}
          onSubmit={handleCreateProject}
        />
      )}

      {showQuickAdd && (
        <QuickAddModal
          projects={projects}
          onClose={() => setShowQuickAdd(false)}
          onSubmit={handleCreateTask}
        />
      )}

      {selectedTask && (
        <TaskDetailSidebar
          task={selectedTask}
          projects={projects}
          onClose={() => setSelectedTask(null)}
          onUpdate={refreshTaskAndStats}
        />
      )}
    </div>
  );
}
