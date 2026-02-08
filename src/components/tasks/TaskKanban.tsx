import React, { useState } from 'react';
import { toast } from 'sonner';
import { apiRequest } from '../../config/api';
import { Task, Project } from '../../types/task';
import TaskDetailSidebar from './TaskDetailSidebar';
import { formatTaskDateZhCN } from '@/utils/taskDate';

interface TaskKanbanProps {
  tasks: Task[];
  projects: Project[];
  onUpdate: () => void;
}

const TaskKanban: React.FC<TaskKanbanProps> = ({ tasks, projects, onUpdate }) => {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const columns = [
    { id: 'todo', title: '待办', color: 'border-t-gray-300' },
    { id: 'in_progress', title: '进行中', color: 'border-t-blue-300' },
    { id: 'done', title: '已完成', color: 'border-t-green-300' },
    { id: 'cancelled', title: '已取消', color: 'border-t-slate-400' }
  ];

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (columnId: string) => {
    if (!draggedTask || draggedTask.status === columnId) {
      setDraggedTask(null);
      return;
    }

    try {
      await apiRequest(`/api/tasks/${draggedTask.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: columnId })
      });
      toast.success('任务状态更新成功');
      onUpdate();
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error('更新失败');
    } finally {
      setDraggedTask(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      P0: 'bg-red-100 text-red-700',
      P1: 'bg-orange-100 text-orange-700',
      P2: 'bg-yellow-100 text-yellow-700',
      P3: 'bg-gray-100 text-gray-700'
    };
    return colors[priority as keyof typeof colors] || colors.P3;
  };

  const getTaskCard = (task: Task) => (
    <div
      key={task.id}
      draggable
      onDragStart={() => handleDragStart(task)}
      onClick={() => setSelectedTask(task)}
      className="bg-white rounded-lg shadow-sm p-4 mb-3 cursor-move hover:shadow-md transition-shadow border border-gray-200"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-900 flex-1">{task.title}</h4>
        <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center">
          {task.project_name && (
            <>
              <span
                className="w-2 h-2 rounded-full mr-1"
                style={{ backgroundColor: task.project_color }}
              />
              {task.project_name}
            </>
          )}
        </div>
        {task.due_date && (
          <span>{formatTaskDateZhCN(task.due_date)}</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {columns.map(column => (
        <div key={column.id}>
          <div className={`bg-white rounded-t-lg p-4 border border-b-0 border-gray-200 border-t-4 ${column.color}`}>
            <h3 className="font-semibold text-gray-900 flex items-center justify-between">
              {column.title}
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-sm">
                {tasks.filter(t => t.status === column.id).length}
              </span>
            </h3>
          </div>
          <div
            className={`bg-gray-50 rounded-b-lg p-4 min-h-96 border border-t-0 border-gray-200 ${column.color}`}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
          >
            {tasks
              .filter(t => t.status === column.id)
              .sort((a, b) => (a.position || 0) - (b.position || 0))
              .map(getTaskCard)}
          </div>
        </div>
      ))}

      {/* 任务详情侧边栏 */}
      {selectedTask && (
        <TaskDetailSidebar
          task={selectedTask}
          projects={projects}
          onClose={() => setSelectedTask(null)}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
};

export default TaskKanban;
