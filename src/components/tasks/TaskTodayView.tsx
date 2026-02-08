import React from 'react';
import { Task } from '../../types/task';
import { ExclamationTriangleIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { parseTaskDate } from '@/utils/taskDate';

interface TaskTodayViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const TaskTodayView: React.FC<TaskTodayViewProps> = ({ tasks, onTaskClick }) => {
  const formatDueDate = (input: string) => {
    const date = parseTaskDate(input);
    if (!date) return '-';
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${month}月${day}日`;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 分类任务
  const overdueTasks = tasks.filter(task => {
    if (!task.due_date || task.status === 'done' || task.status === 'cancelled') return false;
    const taskDate = parseTaskDate(task.due_date);
    if (!taskDate) return false;
    return taskDate < today;
  });

  const todayTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    if (task.status === 'done' || task.status === 'cancelled') return false;
    const taskDate = parseTaskDate(task.due_date);
    if (!taskDate) return false;
    return taskDate >= today && taskDate < tomorrow;
  });

  const upcomingTasks = tasks.filter(task => {
    if (!task.due_date || task.status === 'done' || task.status === 'cancelled') return false;
    const taskDate = parseTaskDate(task.due_date);
    if (!taskDate) return false;
    return taskDate >= tomorrow && taskDate < new Date(tomorrow.getTime() + 7 * 24 * 60 * 60 * 1000);
  });

  const getPriorityColor = (priority: string) => {
    const colors = {
      P0: 'bg-red-100 text-red-700 border-red-200',
      P1: 'bg-orange-100 text-orange-700 border-orange-200',
      P2: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      P3: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[priority as keyof typeof colors] || colors.P3;
  };

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => (
    <div
      onClick={() => onTaskClick(task)}
      className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-900 flex-1">{task.title}</h4>
        <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          {task.project_name && (
            <>
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: task.project_color }}
              />
              {task.project_name}
            </>
          )}
        </div>
        {task.due_date && (
          <span>{formatDueDate(task.due_date)}</span>
        )}
      </div>
    </div>
  );

  const TaskSection: React.FC<{
    title: string;
    icon: any;
    tasks: Task[];
    color: string;
    bgColor: string;
  }> = ({ title, icon: Icon, tasks: sectionTasks, color, bgColor }) => (
    <div className="mb-6">
      <div className={`flex items-center gap-2 mb-3 ${color}`}>
        <Icon className="h-5 w-5" />
        <h3 className="font-semibold">{title}</h3>
        <span className={`px-2 py-0.5 text-xs font-medium rounded ${bgColor}`}>
          {sectionTasks.length}
        </span>
      </div>

      <div className="space-y-2">
        {sectionTasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      {sectionTasks.length === 0 && (
        <div className={`text-center py-8 rounded-lg border-2 border-dashed ${bgColor.replace('bg-', 'border-').replace('100', '200')}`}>
          <p className="text-sm text-gray-400">暂无任务</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700">已逾期</p>
              <p className="text-2xl font-bold text-red-900 mt-1">{overdueTasks.length}</p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">今天到期</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{todayTasks.length}</p>
            </div>
            <ClockIcon className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">本周待办</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{upcomingTasks.length}</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* 任务列表 */}
      <TaskSection
        title="已逾期任务"
        icon={ExclamationTriangleIcon}
        tasks={overdueTasks}
        color="text-red-600"
        bgColor="bg-red-100"
      />

      <TaskSection
        title="今天到期"
        icon={ClockIcon}
        tasks={todayTasks}
        color="text-blue-600"
        bgColor="bg-blue-100"
      />

      <TaskSection
        title="即将到来（7天内）"
        icon={ClockIcon}
        tasks={upcomingTasks}
        color="text-gray-600"
        bgColor="bg-gray-100"
      />

      {/* 提示 */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <p>💡 <strong>提示：</strong></p>
        <ul className="mt-2 space-y-1 list-disc list-inside">
          <li>逾期任务请优先处理</li>
          <li>点击任务卡片查看详情或编辑</li>
          <li>使用快捷键 <kbd className="px-1 py-0.5 bg-gray-200 rounded">Cmd+K</kbd> 快速添加任务</li>
        </ul>
      </div>
    </div>
  );
};

export default TaskTodayView;
