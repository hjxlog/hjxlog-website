import React from 'react';
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface TaskStatsProps {
  stats: {
    total: number;
    todo: number;
    in_progress: number;
    done: number;
    p0: number;
    p1: number;
    overdue: number;
  };
}

const TaskStats: React.FC<TaskStatsProps> = ({ stats }) => {
  const cards = [
    {
      title: '全部任务',
      value: stats.total,
      icon: ClipboardDocumentListIcon,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600'
    },
    {
      title: '待办',
      value: stats.todo,
      icon: ClockIcon,
      color: 'bg-gray-500',
      textColor: 'text-gray-600'
    },
    {
      title: '进行中',
      value: stats.in_progress,
      icon: ExclamationTriangleIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: '已完成',
      value: stats.done,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'P0 紧急',
      value: stats.p0,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      textColor: 'text-red-600'
    },
    {
      title: 'P1 高优',
      value: stats.p1,
      icon: ExclamationTriangleIcon,
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
      {cards.map(card => {
        const Icon = card.icon;
        return (
          <div key={card.title} className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">{card.title}</p>
                <p className={`text-xl font-bold ${card.textColor} mt-1`}>{card.value}</p>
              </div>
              <div className={`${card.color} p-1.5 rounded-lg`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaskStats;
