import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { apiRequest } from '../../config/api';
import { Task, SubTask } from '../../types/task';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
  onUpdate: () => void;
}

interface SubTask {
  id: number;
  title: string;
  completed: boolean;
}

const TaskDetailSidebar: React.FC<TaskDetailProps> = ({ task, onClose, onUpdate }) => {
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [newSubTask, setNewSubTask] = useState('');
  const [loading, setLoading] = useState(false);

  // 获取子任务列表
  const fetchSubTasks = async () => {
    try {
      // 这里需要后端支持子任务API，暂时使用模拟数据
      // const data = await apiRequest(`/api/tasks/${task.id}/subtasks`);
      // setSubTasks(data.data || []);

      // 模拟数据
      setSubTasks([
        { id: 1, title: '收集数据', completed: true },
        { id: 2, title: '写分析报告', completed: false },
        { id: 3, title: '发邮件给老板', completed: false }
      ]);
    } catch (error) {
      console.error('Failed to fetch subtasks:', error);
    }
  };

  // 创建子任务
  const handleCreateSubTask = async () => {
    if (!newSubTask.trim()) {
      toast.error('请输入子任务内容');
      return;
    }

    try {
      setLoading(true);
      // await apiRequest(`/api/tasks/${task.id}/subtasks`, {
      //   method: 'POST',
      //   body: JSON.stringify({ title: newSubTask })
      // });

      // 模拟添加
      const newSub: SubTask = {
        id: Date.now(),
        title: newSubTask,
        completed: false
      };
      setSubTasks([...subTasks, newSub]);
      setNewSubTask('');
      toast.success('子任务创建成功');
    } catch (error) {
      toast.error('创建失败');
    } finally {
      setLoading(false);
    }
  };

  // 切换子任务完成状态
  const handleToggleSubTask = async (subTaskId: number) => {
    try {
      // await apiRequest(`/api/tasks/${task.id}/subtasks/${subTaskId}`, {
      //   method: 'PATCH',
      //   body: JSON.stringify({ completed: !subTask.completed })
      // });

      // 模拟切换
      setSubTasks(subTasks.map(st =>
        st.id === subTaskId ? { ...st, completed: !st.completed } : st
      ));
    } catch (error) {
      toast.error('更新失败');
    }
  };

  // 删除子任务
  const handleDeleteSubTask = async (subTaskId: number) => {
    try {
      // await apiRequest(`/api/tasks/${task.id}/subtasks/${subTaskId}`, {
      //   method: 'DELETE'
      // });

      // 模拟删除
      setSubTasks(subTasks.filter(st => st.id !== subTaskId));
      toast.success('子任务删除成功');
    } catch (error) {
      toast.error('删除失败');
    }
  };

  // 更新任务状态
  const handleUpdateStatus = async (status: string) => {
    try {
      await apiRequest(`/api/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      toast.success('状态更新成功');
      onUpdate();
    } catch (error) {
      toast.error('更新失败');
    }
  };

  useEffect(() => {
    fetchSubTasks();
  }, [task.id]);

  const completedCount = subTasks.filter(st => st.completed).length;
  const progress = subTasks.length > 0 ? Math.round((completedCount / subTasks.length) * 100) : 0;

  const getStatusColor = (status: string) => {
    const colors = {
      todo: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-blue-100 text-blue-700',
      done: 'bg-green-100 text-green-700'
    };
    return colors[status as keyof typeof colors] || colors.todo;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      todo: '待办',
      in_progress: '进行中',
      done: '已完成'
    };
    return labels[status as keyof typeof labels] || '待办';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      P0: 'bg-red-100 text-red-700',
      P1: 'bg-orange-100 text-orange-700',
      P2: 'bg-yellow-100 text-yellow-700',
      P3: 'bg-gray-100 text-gray-700'
    };
    return colors[priority as keyof typeof colors] || colors.P2;
  };

  return (
    <>
      <button
        type="button"
        aria-label="关闭任务详情"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/30"
      />
      <aside className="fixed inset-y-0 right-0 z-50 w-full md:w-96 bg-white shadow-2xl transform transition-transform">
      <div className="h-full flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">任务详情</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 标题 */}
          <h3 className="text-xl font-bold text-gray-900 mb-4">{task.title}</h3>

          {/* 状态和优先级 */}
          <div className="flex gap-2 mb-4">
            <span className={`px-3 py-1 text-sm font-medium rounded ${getStatusColor(task.status)}`}>
              {getStatusLabel(task.status)}
            </span>
            <span className={`px-3 py-1 text-sm font-medium rounded ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
          </div>

          {/* 描述 */}
          {task.description && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">描述</h4>
              <p className="text-sm text-gray-600">{task.description}</p>
            </div>
          )}

          {/* 截止日期 */}
          {task.start_date && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">开始日期</h4>
              <p className="text-sm text-gray-600">
                {new Date(task.start_date).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}

          {task.due_date && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">截止日期</h4>
              <p className="text-sm text-gray-600">
                {new Date(task.due_date).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}

          {/* 标签 */}
          {task.tags && task.tags.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">标签</h4>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 进度 */}
          {subTasks.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">进度</h4>
                <span className="text-sm text-gray-500">{completedCount}/{subTasks.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* 子任务列表 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">子任务</h4>

            {/* 添加子任务 */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newSubTask}
                onChange={(e) => setNewSubTask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateSubTask()}
                placeholder="添加子任务..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={handleCreateSubTask}
                disabled={loading}
                className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>

            {/* 子任务列表 */}
            <div className="space-y-2">
              {subTasks.map((subTask) => (
                <div
                  key={subTask.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
                >
                  <button
                    onClick={() => handleToggleSubTask(subTask.id)}
                    className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      subTask.completed
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'border-gray-300 hover:border-indigo-600'
                    }`}
                  >
                    {subTask.completed && <CheckIcon className="h-3 w-3 text-white" />}
                  </button>

                  <span
                    className={`flex-1 text-sm ${
                      subTask.completed ? 'text-gray-400 line-through' : 'text-gray-700'
                    }`}
                  >
                    {subTask.title}
                  </span>

                  <button
                    onClick={() => handleDeleteSubTask(subTask.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {subTasks.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  暂无子任务
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="p-6 border-t">
          <div className="flex gap-2">
            <button
              onClick={() => handleUpdateStatus('todo')}
              className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              待办
            </button>
            <button
              onClick={() => handleUpdateStatus('in_progress')}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              进行中
            </button>
            <button
              onClick={() => handleUpdateStatus('done')}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              完成
            </button>
          </div>
        </div>
      </div>
      </aside>
    </>
  );
};

export default TaskDetailSidebar;
