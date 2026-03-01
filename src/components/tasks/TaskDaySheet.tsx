import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Task } from '@/types/task';
import { parseTaskDate } from '@/utils/taskDate';

interface TaskDaySheetProps {
  open: boolean;
  date: string;
  tasks: Task[];
  onClose: () => void;
  onTaskClick: (task: Task) => void;
  onCreateForDate: (date: string) => void;
}

const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const TaskDaySheet: React.FC<TaskDaySheetProps> = ({
  open,
  date,
  tasks,
  onClose,
  onTaskClick,
  onCreateForDate
}) => {
  if (!open) return null;

  const day = parseTaskDate(date);
  const title = day
    ? `${day.getMonth() + 1}月${day.getDate()}日 ${weekNames[day.getDay()]}`
    : date;

  const getPriorityColor = (priority: Task['priority']) => {
    if (priority === 'P0') return 'bg-red-100 text-red-700';
    if (priority === 'P1') return 'bg-orange-100 text-orange-700';
    if (priority === 'P2') return 'bg-yellow-100 text-yellow-700';
    return 'bg-slate-100 text-slate-700';
  };

  const getStatusLabel = (status: Task['status']) => {
    if (status === 'todo') return '待办';
    if (status === 'in_progress') return '进行中';
    if (status === 'done') return '已完成';
    return '已取消';
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        className="h-full w-full bg-black/35"
        onClick={onClose}
        aria-label="关闭日期任务列表"
      />
      <div className="absolute bottom-0 left-0 right-0 h-[70vh] rounded-t-2xl bg-white shadow-2xl">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200 px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="关闭"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">共 {tasks.length} 项任务</span>
              <button
                onClick={() => onCreateForDate(date)}
                className="rounded-lg bg-[#165DFF] px-3 py-1.5 text-xs font-medium text-white"
              >
                新建任务
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {tasks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 px-3 py-8 text-center text-sm text-slate-400">
                这一天暂无任务
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => {
                      onTaskClick(task);
                      onClose();
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-900">{task.title}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>{getStatusLabel(task.status)}</span>
                          {task.project_name ? <span>· {task.project_name}</span> : null}
                        </div>
                      </div>
                      <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDaySheet;
