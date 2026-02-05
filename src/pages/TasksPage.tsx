import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { apiRequest } from '../config/api';
import {
  ArrowLeftIcon,
  PlusIcon,
  Squares2X2Icon,
  ListBulletIcon,
  CalendarDaysIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import TaskKanban from '../components/tasks/TaskKanban';
import TaskList from '../components/tasks/TaskList';
import TaskFilters from '../components/tasks/TaskFilters';
import TaskStats from '../components/tasks/TaskStats';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import CreateProjectModal from '../components/tasks/CreateProjectModal';
import QuickAddModal from '../components/tasks/QuickAddModal';
import TaskCalendar from '../components/tasks/TaskCalendar';
import TaskTodayView from '../components/tasks/TaskTodayView';
import TaskDetailSidebar from '../components/tasks/TaskDetailSidebar';
import { useShortcut } from '../hooks/useShortcut';
import { Task, Project, ViewType } from '../types/task';

const TasksPage: React.FC = () => {
  const navigate = useNavigate();
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

  // 获取项目列表
  const fetchProjects = async () => {
    try {
      const data = await apiRequest<{ success: boolean; data: Project[] }>('/api/tasks/projects');
      setProjects(data.data || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  // 获取任务列表
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

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const data = await apiRequest<{ success: boolean; data: any }>('/api/tasks/stats/overview');
      setStats(data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // 初始化加载
  useEffect(() => {
    fetchProjects();
    fetchTasks();
    fetchStats();
  }, []);

  // 筛选变化时重新加载
  useEffect(() => {
    fetchTasks();
  }, [filters]);

  // 全局快捷键 Cmd+K 打开快速添加
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

  const activeProject = projects.find(p => p.id === filters.project_id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Squares2X2Icon className="h-7 w-7 mr-2 text-indigo-600" />
                  Task Force
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {activeProject ? `${activeProject.name} - ` : ''}任务与项目管理
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCreateProject(true)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                新建项目
              </button>
              <button
                onClick={() => setShowCreateTask(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                新建任务
              </button>
            </div>
          </div>

          {/* 视图切换和筛选 */}
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setView('kanban')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === 'kanban'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Squares2X2Icon className="h-4 w-4 inline mr-1" />
                看板
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === 'list'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ListBulletIcon className="h-4 w-4 inline mr-1" />
                列表
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === 'calendar'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
                日历
              </button>
              <button
                onClick={() => setView('today')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === 'today'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
                今天
              </button>
            </div>

            <TaskFilters
              projects={projects}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 统计卡片 */}
        {stats && <TaskStats stats={stats} />}

        {/* 任务视图 */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {view === 'kanban' && <TaskKanban tasks={tasks} onUpdate={fetchTasks} />}
            {view === 'list' && <TaskList tasks={tasks} onUpdate={fetchTasks} />}
            {view === 'calendar' && (
              <TaskCalendar
                tasks={tasks}
                onTaskClick={setSelectedTask}
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

      {/* 创建任务弹窗 */}
      {showCreateTask && (
        <CreateTaskModal
          projects={projects}
          onClose={() => setShowCreateTask(false)}
          onSubmit={handleCreateTask}
        />
      )}

      {/* 创建项目弹窗 */}
      {showCreateProject && (
        <CreateProjectModal
          onClose={() => setShowCreateProject(false)}
          onSubmit={handleCreateProject}
        />
      )}

      {/* 快速添加弹窗 */}
      {showQuickAdd && (
        <QuickAddModal
          projects={projects}
          onClose={() => setShowQuickAdd(false)}
          onSubmit={handleCreateTask}
        />
      )}

      {/* 任务详情侧边栏 */}
      {selectedTask && (
        <TaskDetailSidebar
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={fetchTasks}
        />
      )}
    </div>
  );
};

export default TasksPage;
