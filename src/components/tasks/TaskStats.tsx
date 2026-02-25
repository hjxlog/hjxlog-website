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
    <>
      <div className="mb-3 grid grid-cols-3 gap-2 md:hidden">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2"
              >
                <div className={`${card.color} rounded-md p-1`}>
                  <Icon className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="leading-tight">
                  <p className="text-[11px] text-slate-500">{card.title}</p>
                  <p className={`text-sm font-semibold ${card.textColor}`}>{card.value}</p>
                </div>
              </div>
            );
          })}
      </div>

      <div className="mb-4 hidden grid-cols-3 gap-3 lg:grid-cols-6 md:grid">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="rounded-lg bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">{card.title}</p>
                  <p className={`mt-1 text-xl font-bold ${card.textColor}`}>{card.value}</p>
                </div>
                <div className={`${card.color} rounded-lg p-1.5`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default TaskStats;
