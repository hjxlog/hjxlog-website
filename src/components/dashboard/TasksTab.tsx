import React, { useEffect, useState } from 'react';
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

export default function TasksTab() {
  const [view, setView] = useState<ViewType>('kanban');
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
  const [createTaskInitialData, setCreateTaskInitialData] = useState<{ due_date?: string } | null>(null);

  const fetchProjects = async () => {
    try {
      const data = await apiRequest<{ success: boolean; data: Project[] }>('/api/tasks/projects');
      setProjects(data.data || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.project_id) params.append('project_id', filters.project_id.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);

      const data = await apiRequest<{ success: boolean; data: Task[] }>(`/api/tasks?${params}`);
      setTasks(data.data || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error('获取任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiRequest<{ success: boolean; data: any }>('/api/tasks/stats/overview');
      setStats(data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchTasks();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  useShortcut('cmd+k', () => {
    setShowQuickAdd(true);
  });

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
      fetchTasks();
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Task Force</h3>
              <p className="text-sm text-slate-500">任务与项目管理</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateProject(true)}
                className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                新建项目
              </button>
              <button
                onClick={() => {
                  setCreateTaskInitialData(null);
                  setShowCreateTask(true);
                }}
                className="px-3 py-2 text-sm font-medium text-white bg-[#165DFF] rounded-lg hover:bg-[#0E4BA4] transition-colors flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                新建任务
              </button>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
            <div className="flex items-center flex-wrap gap-2">
              <button
                onClick={() => setView('kanban')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === 'kanban'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                看板
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === 'list'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                列表
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === 'calendar'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                日历
              </button>
              <button
                onClick={() => setView('today')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 min-h-[320px]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#165DFF]"></div>
          </div>
        ) : (
          <>
            {view === 'kanban' && <TaskKanban tasks={tasks} onUpdate={fetchTasks} />}
            {view === 'list' && <TaskList tasks={tasks} onUpdate={fetchTasks} />}
            {view === 'calendar' && (
              <TaskCalendar
                tasks={tasks}
                onTaskClick={setSelectedTask}
                onCreateForDate={(date) => {
                  setCreateTaskInitialData({ due_date: date });
                  setShowCreateTask(true);
                }}
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
          onSubmit={handleCreateTask}
          initialTask={createTaskInitialData || undefined}
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
          onClose={() => setSelectedTask(null)}
          onUpdate={fetchTasks}
        />
      )}
    </div>
  );
}
