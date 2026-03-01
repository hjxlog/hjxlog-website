import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import TaskDetailSidebar from '@/components/tasks/TaskDetailSidebar';
import LoadingSpinner from '@/components/LoadingSpinner';
import { apiRequest } from '@/config/api';
import { Project, Task } from '@/types/task';

export default function TaskDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const taskId = Number(id);
  const [task, setTask] = useState<Task | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!Number.isInteger(taskId) || taskId <= 0) {
      toast.error('任务ID无效');
      navigate('/dashboard?tab=tasks');
      return;
    }

    try {
      setLoading(true);
      const [taskRes, projectRes] = await Promise.all([
        apiRequest(`/api/tasks/${taskId}`) as Promise<{ success: boolean; data: Task }>,
        apiRequest('/api/tasks/projects') as Promise<{ success: boolean; data: Project[] }>
      ]);
      setTask(taskRes.data || null);
      setProjects(projectRes.data || []);
    } catch (error) {
      console.error('Failed to fetch task detail page data:', error);
      toast.error('加载任务详情失败');
      navigate('/dashboard?tab=tasks');
    } finally {
      setLoading(false);
    }
  }, [navigate, taskId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="任务详情加载中..." />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-slate-500">
        <p>未找到对应任务</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard?tab=tasks')}
          className="px-3 py-2 text-sm font-medium text-white bg-[#165DFF] rounded-lg hover:bg-[#0E4BA4] transition-colors"
        >
          返回任务面板
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-5 py-4 sm:py-6">
        <button
          type="button"
          onClick={() => navigate('/dashboard?tab=tasks')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          返回任务列表
        </button>
        <TaskDetailSidebar
          task={task}
          projects={projects}
          onClose={() => navigate('/dashboard?tab=tasks')}
          onUpdate={fetchData}
          variant="page"
        />
      </div>
    </div>
  );
}
