import React, { useState } from 'react';
import { Task } from '../../types/task';
import { CheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import TaskDetailSidebar from './TaskDetailSidebar';

interface TaskListProps {
  tasks: Task[];
  onUpdate: () => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onUpdate }) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const getPriorityColor = (priority: string) => {
    const colors = {
      P0: 'bg-red-100 text-red-700',
      P1: 'bg-orange-100 text-orange-700',
      P2: 'bg-yellow-100 text-yellow-700',
      P3: 'bg-gray-100 text-gray-700'
    };
    return colors[priority as keyof typeof colors] || colors.P3;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      todo: { color: 'bg-gray-100 text-gray-700', icon: ClockIcon, label: '待办' },
      in_progress: { color: 'bg-blue-100 text-blue-700', icon: ClockIcon, label: '进行中' },
      done: { color: 'bg-green-100 text-green-700', icon: CheckIcon, label: '已完成' }
    };
    return badges[status as keyof typeof badges] || badges.todo;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              任务
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              项目
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              优先级
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              状态
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              截止日期
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tasks.map(task => {
            const statusBadge = getStatusBadge(task.status);
            const StatusIcon = statusBadge.icon;

            return (
              <tr
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                        {task.description}
                      </div>
                    )}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
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
                  </div>
                </td>
                <td className="px-6 py-4">
                  {task.project_name && (
                    <div className="flex items-center">
                      <span
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: task.project_color }}
                      />
                      <span className="text-sm text-gray-900">{task.project_name}</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${statusBadge.color}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusBadge.label}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {task.due_date ? new Date(task.due_date).toLocaleDateString('zh-CN') : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {tasks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          暂无任务
        </div>
      )}

      {/* 任务详情侧边栏 */}
      {selectedTask && (
        <TaskDetailSidebar
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
};

export default TaskList;
