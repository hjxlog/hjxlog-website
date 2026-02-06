import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Task } from '../../types/task';

interface TaskCalendarProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onCreateForDate?: (date: string) => void;
}

const TaskCalendar: React.FC<TaskCalendarProps> = ({ tasks, onTaskClick, onCreateForDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMonthData = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

    return { year, month, daysInMonth, startDayOfWeek };
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return (
        taskDate.getFullYear() === date.getFullYear() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getDate() === date.getDate()
      );
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const { year, month, daysInMonth, startDayOfWeek } = getMonthData(currentDate);
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月',
                      '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  // 生成日历格子
  const calendarDays = [];

  // 空白格子（月初）
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-24 bg-gray-50" />);
  }

  // 日期格子
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayTasks = getTasksForDate(date);
    const today = isToday(date);
    const past = isPast(date);

    calendarDays.push(
      <div
        key={day}
        className={`h-24 p-2 border border-gray-100 ${
          today ? 'bg-blue-50' : 'bg-white'
        } ${past ? 'bg-gray-50' : ''} hover:bg-gray-50 transition-colors cursor-pointer`}
      >
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateForDate?.(getLocalDateString(date));
            }}
            className="p-0.5 rounded text-gray-400 hover:text-[#165DFF] hover:bg-blue-100 transition-colors"
            title={`为 ${getLocalDateString(date)} 添加任务`}
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </button>
          <div className={`text-sm font-medium ${
            today ? 'text-blue-600' : past ? 'text-gray-400' : 'text-gray-700'
          }`}>
            {day}
          </div>
        </div>
        <div className="space-y-1">
          {dayTasks.slice(0, 3).map(task => (
            <div
              key={task.id}
              onClick={(e) => {
                e.stopPropagation();
                onTaskClick?.(task);
              }}
              className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${
                task.status === 'done'
                  ? 'bg-green-100 text-green-700 line-through'
                  : task.priority === 'P0'
                  ? 'bg-red-100 text-red-700'
                  : task.priority === 'P1'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {task.title}
            </div>
          ))}
          {dayTasks.length > 3 && (
            <div className="text-xs text-gray-500">
              +{dayTasks.length - 3} 更多
            </div>
          )}
        </div>
      </div>
    );
  }

  // 统计当月任务
  const monthTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    const taskDate = new Date(task.due_date);
    return taskDate.getMonth() === month && taskDate.getFullYear() === year;
  });

  const completedCount = monthTasks.filter(t => t.status === 'done').length;
  const overdueCount = monthTasks.filter(t => {
    if (!t.due_date || t.status === 'done') return false;
    return new Date(t.due_date) < new Date();
  }).length;

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* 头部 */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {year}年 {monthNames[month]}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              今天
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* 统计 */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-600">总计: {monthTasks.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-600">完成: {completedCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-gray-600">逾期: {overdueCount}</span>
          </div>
        </div>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-700 bg-gray-50">
            {day}
          </div>
        ))}
      </div>

      {/* 日历格子 */}
      <div className="grid grid-cols-7">
        {calendarDays}
      </div>

      {/* 提示 */}
      <div className="p-4 border-t bg-gray-50">
        <p className="text-sm text-gray-500">
          💡 日期格左上角 `+` 可快速添加当天任务
        </p>
      </div>
    </div>
  );
};

export default TaskCalendar;
