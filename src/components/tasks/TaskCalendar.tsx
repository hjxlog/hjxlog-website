import React, { useEffect, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Task } from '../../types/task';
import { parseTaskDate } from '@/utils/taskDate';

interface TaskCalendarProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onCreateForDate?: (date: string) => void;
  onMoveTask?: (task: Task, targetDate: string) => void;
  onResizeTask?: (task: Task, targetDate: string) => void;
}

const TaskCalendar: React.FC<TaskCalendarProps> = ({ tasks, onTaskClick, onCreateForDate, onMoveTask, onResizeTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [hoveredTaskId, setHoveredTaskId] = useState<number | null>(null);
  const [draggingPayload, setDraggingPayload] = useState<{ taskId: number; mode: 'move' | 'resize' } | null>(null);
  const [dragNavDirection, setDragNavDirection] = useState<'prev' | 'next' | null>(null);
  const [isCompact, setIsCompact] = useState(false);

  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseLocalDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, (month || 1) - 1, day || 1);
  };

  const toLocalDate = (value?: string | null) => {
    return parseTaskDate(value);
  };

  const getTaskRange = (task: Task) => {
    const rawStart = task.start_date || task.due_date;
    const rawEnd = task.due_date || task.start_date;
    const start = toLocalDate(rawStart);
    const end = toLocalDate(rawEnd);
    if (!start && !end) return null;
    const safeStart = start || end;
    const safeEnd = end || start;
    if (!safeStart || !safeEnd) return null;
    return safeStart <= safeEnd
      ? { start: safeStart, end: safeEnd }
      : { start: safeEnd, end: safeStart };
  };

  const isDateInRange = (date: Date, start: Date, end: Date) => {
    return date >= start && date <= end;
  };

  const getDaysSpan = (start: Date, end: Date) => {
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1);
  };

  const hexToRgba = (hex: string, alpha: number) => {
    const normalized = hex.replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
    const red = parseInt(normalized.slice(0, 2), 16);
    const green = parseInt(normalized.slice(2, 4), 16);
    const blue = parseInt(normalized.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
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
      const range = getTaskRange(task);
      if (!range) return false;
      return isDateInRange(date, range.start, range.end);
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

  useEffect(() => {
    if (!draggingPayload || !dragNavDirection) return;
    const timer = setInterval(() => {
      setCurrentDate((prev) => {
        const diff = dragNavDirection === 'prev' ? -1 : 1;
        return new Date(prev.getFullYear(), prev.getMonth() + diff, 1);
      });
    }, 550);
    return () => clearInterval(timer);
  }, [draggingPayload, dragNavDirection]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 640px)');
    const handleChange = () => setIsCompact(media.matches);
    handleChange();
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', handleChange);
      return () => media.removeEventListener('change', handleChange);
    }
    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);

  const { year, month, daysInMonth, startDayOfWeek } = getMonthData(currentDate);
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月',
                      '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const cellHeight = isCompact ? 92 : 144;
  const laneHeight = isCompact ? 16 : 26;
  const laneTopOffset = isCompact ? 28 : 40;
  const laneGap = isCompact ? 1 : 2;
  const totalDateCells = startDayOfWeek + daysInMonth;
  const totalRows = Math.ceil(totalDateCells / 7);

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const monthTasksWithRange = tasks
    .map(task => ({ task, range: getTaskRange(task) }))
    .filter((item): item is { task: Task; range: { start: Date; end: Date } } => {
      if (!item.range) return false;
      return !(item.range.end < monthStart || item.range.start > monthEnd);
    })
    .sort((left, right) => {
      const startDiff = left.range.start.getTime() - right.range.start.getTime();
      if (startDiff !== 0) return startDiff;
      return left.range.end.getTime() - right.range.end.getTime();
    });

  const laneEnds: Date[] = [];
  const taskLaneMap = new Map<number, number>();
  for (const item of monthTasksWithRange) {
    let laneIndex = laneEnds.findIndex(endDate => item.range.start > endDate);
    if (laneIndex < 0) {
      laneIndex = laneEnds.length;
      laneEnds.push(item.range.end);
    } else {
      laneEnds[laneIndex] = item.range.end;
    }
    taskLaneMap.set(item.task.id, laneIndex);
  }

  const draggedTask = draggingPayload ? tasks.find(task => task.id === draggingPayload.taskId) || null : null;
  const draggedTaskRange = draggedTask ? getTaskRange(draggedTask) : null;
  const previewLane = draggedTask ? (taskLaneMap.get(draggedTask.id) ?? 0) : 0;
  let previewRange: { start: Date; end: Date; mode: 'move' | 'resize' } | null = null;
  if (dragOverDate && draggingPayload && draggedTaskRange) {
    const targetDate = parseLocalDate(dragOverDate);
    if (draggingPayload.mode === 'move') {
      const duration = Math.max(0, Math.round((draggedTaskRange.end.getTime() - draggedTaskRange.start.getTime()) / (24 * 60 * 60 * 1000)));
      const previewEnd = new Date(targetDate);
      previewEnd.setDate(previewEnd.getDate() + duration);
      previewRange = { start: targetDate, end: previewEnd, mode: 'move' };
    } else {
      const previewEnd = targetDate < draggedTaskRange.start ? draggedTaskRange.start : targetDate;
      previewRange = { start: draggedTaskRange.start, end: previewEnd, mode: 'resize' };
    }
  }

  const toMonthIndex = (date: Date) => startDayOfWeek + date.getDate() - 1;
  const dateInSameMonth = (date: Date) => date.getFullYear() === year && date.getMonth() === month;
  const monthLastIndex = startDayOfWeek + daysInMonth - 1;

  const buildRangeSegments = (
    range: { start: Date; end: Date },
    lane: number
  ) => {
    const startIndex = range.start < monthStart || !dateInSameMonth(range.start) ? 0 : toMonthIndex(range.start);
    const endIndex = range.end > monthEnd || !dateInSameMonth(range.end) ? monthLastIndex : toMonthIndex(range.end);
    const segments: Array<{
      row: number;
      colStart: number;
      colEnd: number;
      kind: 'single' | 'start' | 'middle' | 'end';
      lane: number;
    }> = [];

    for (let row = Math.floor(startIndex / 7); row <= Math.floor(endIndex / 7); row++) {
      const rowStart = row * 7;
      const rowEnd = rowStart + 6;
      const segStartIndex = Math.max(startIndex, rowStart);
      const segEndIndex = Math.min(endIndex, rowEnd);
      const isSegStart = segStartIndex === startIndex;
      const isSegEnd = segEndIndex === endIndex;
      const kind = isSegStart && isSegEnd ? 'single' : isSegStart ? 'start' : isSegEnd ? 'end' : 'middle';
      segments.push({
        row,
        colStart: segStartIndex % 7,
        colEnd: segEndIndex % 7,
        kind,
        lane
      });
    }

    return segments;
  };

  const overlayBars = monthTasksWithRange.flatMap(item => {
    const lane = taskLaneMap.get(item.task.id) ?? 0;
    return buildRangeSegments(item.range, lane).map(segment => ({
      task: item.task,
      range: item.range,
      lane,
      ...segment
    }));
  });

  const overlayPreviewBars = previewRange
    ? buildRangeSegments(previewRange, previewLane).map(segment => ({
        ...segment,
        mode: previewRange.mode
      }))
    : [];

  const rowLaneCounts = Array.from({ length: totalRows }, () => 0);
  if (!isCompact) {
    for (const item of monthTasksWithRange) {
      const lane = taskLaneMap.get(item.task.id) ?? 0;
      const segments = buildRangeSegments(item.range, lane);
      for (const segment of segments) {
        rowLaneCounts[segment.row] = Math.max(rowLaneCounts[segment.row], lane + 1);
      }
    }
  }

  const rowHeights = isCompact
    ? Array.from({ length: totalRows }, () => cellHeight)
    : rowLaneCounts.map((count) => {
        const laneCount = Math.max(1, count);
        const computed = laneTopOffset + laneCount * (laneHeight + laneGap) + 12;
        return Math.max(cellHeight, computed);
      });

  const rowOffsets: number[] = [];
  for (let i = 0; i < rowHeights.length; i++) {
    rowOffsets[i] = i === 0 ? 0 : rowOffsets[i - 1] + rowHeights[i - 1];
  }

  // 生成日历底层格子
  const calendarDays = [];

  // 空白格子（月初）
  for (let i = 0; i < startDayOfWeek; i++) {
    const rowIndex = Math.floor(i / 7);
    calendarDays.push(
      <div
        key={`empty-${i}`}
        className="bg-gray-50 border border-gray-100"
        style={{ height: rowHeights[rowIndex] || cellHeight }}
      />
    );
  }

  // 日期格子
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateKey = getLocalDateString(date);
    const today = isToday(date);
    const past = isPast(date);
    const rowIndex = Math.floor((startDayOfWeek + day - 1) / 7);
    const laneCount = Math.max(1, rowLaneCounts[rowIndex] || 0);
    const dayTasks = isCompact ? getTasksForDate(date) : [];
    const dayTaskCount = dayTasks.length;

    calendarDays.push(
      <div
        key={day}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverDate(dateKey);
        }}
        onDragLeave={() => {
          if (dragOverDate === dateKey) {
            setDragOverDate(null);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          const raw = e.dataTransfer.getData('text/plain');
          if (!raw) return;
          try {
            const payload = JSON.parse(raw) as { taskId: number; mode: 'move' | 'resize' };
            const task = tasks.find(item => item.id === payload.taskId);
            if (!task) return;
            if (payload.mode === 'move') {
              onMoveTask?.(task, dateKey);
            } else {
              onResizeTask?.(task, dateKey);
            }
          } catch {
            console.error('Invalid calendar drag payload');
          } finally {
            setDragOverDate(null);
            setDraggingPayload(null);
            setDragNavDirection(null);
          }
        }}
        className={`p-2 border border-gray-100 ${
          today ? 'bg-blue-50' : 'bg-white'
        } ${past ? 'bg-gray-50' : ''} ${dragOverDate === dateKey ? 'ring-2 ring-[#165DFF] ring-inset' : ''} hover:bg-gray-50 transition-colors cursor-pointer`}
        style={{ height: rowHeights[rowIndex] || cellHeight }}
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
            <PlusIcon className="h-5 w-5" />
          </button>
          <div className={`text-lg font-bold ${
            today ? 'text-blue-600' : past ? 'text-gray-400' : 'text-gray-700'
          }`}>
            {day}
          </div>
        </div>
        <div className="space-y-0.5">
          {isCompact ? (
            <div className="flex flex-wrap items-center gap-1">
              {Array.from({ length: Math.min(3, dayTaskCount) }).map((_, index) => (
                <span key={`dot-${day}-${index}`} className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              ))}
              {dayTaskCount > 3 && (
                <span className="text-sm font-semibold text-slate-500">+{dayTaskCount - 3}</span>
              )}
            </div>
          ) : (
            Array.from({ length: laneCount }).map((_, lane) => (
              <div key={`lane-empty-${day}-${lane}`} className="h-[26px]" />
            ))
          )}
        </div>
      </div>
    );
  }

  // 统计当月任务
  const monthTasks = tasks.filter(task => {
    return monthTasksWithRange.some(item => item.task.id === task.id);
  });

  const completedCount = monthTasks.filter(t => t.status === 'done').length;
  const overdueCount = monthTasks.filter(t => {
    if (t.status === 'done') return false;
    const range = getTaskRange(t);
    if (!range) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return range.end < today;
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
              onDragOver={(e) => {
                if (!draggingPayload) return;
                e.preventDefault();
                setDragNavDirection('prev');
              }}
              onDragLeave={() => {
                if (dragNavDirection === 'prev') {
                  setDragNavDirection(null);
                }
              }}
              onDrop={() => setDragNavDirection(null)}
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
              onDragOver={(e) => {
                if (!draggingPayload) return;
                e.preventDefault();
                setDragNavDirection('next');
              }}
              onDragLeave={() => {
                if (dragNavDirection === 'next') {
                  setDragNavDirection(null);
                }
              }}
              onDrop={() => setDragNavDirection(null)}
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

      {/* 日历格子 + 任务覆盖层 */}
      <div className="relative">
        <div className="grid grid-cols-7">
          {calendarDays}
        </div>

        {!isCompact && (
          <div className="absolute inset-0 pointer-events-none">
            {overlayPreviewBars.map((segment, index) => {
              const left = (segment.colStart / 7) * 100;
              const width = ((segment.colEnd - segment.colStart + 1) / 7) * 100;
              const segmentShapeClass =
                segment.kind === 'single'
                ? 'rounded'
                : segment.kind === 'start'
                ? 'rounded-l rounded-r-none'
                : segment.kind === 'middle'
                ? 'rounded-none'
                : 'rounded-r rounded-l-none';

              return (
                <div
                  key={`preview-bar-${index}`}
                  className={`absolute text-sm h-[26px] leading-[26px] px-2 border border-[#165DFF]/40 bg-[#165DFF]/18 text-[#165DFF] ${segmentShapeClass}`}
                  style={{
                    top: (rowOffsets[segment.row] || 0) + laneTopOffset + segment.lane * (laneHeight + laneGap),
                    left: `calc(${left}% + 4px)`,
                    width: `calc(${width}% - 8px)`
                  }}
                >
                  {segment.kind === 'start' || segment.kind === 'single'
                    ? (segment.mode === 'move' ? '移动预览' : '延长预览')
                    : ''}
                </div>
              );
            })}

            {overlayBars.map((segment, index) => {
            const left = (segment.colStart / 7) * 100;
            const width = ((segment.colEnd - segment.colStart + 1) / 7) * 100;
            const segmentShapeClass =
              segment.kind === 'single'
                ? 'rounded'
                : segment.kind === 'start'
                ? 'rounded-l rounded-r-none'
                : segment.kind === 'middle'
                ? 'rounded-none'
                : 'rounded-r rounded-l-none';
            const isHovered = hoveredTaskId === segment.task.id;
            const colorClass =
              segment.task.status === 'done'
                ? 'bg-green-100 text-green-700 border-green-200'
                : segment.task.priority === 'P0'
                ? 'bg-red-100 text-red-700 border-red-200'
                : segment.task.priority === 'P1'
                ? 'bg-orange-100 text-orange-700 border-orange-200'
                : 'bg-blue-100 text-blue-700 border-blue-200';
            const projectTintStyle = segment.task.project_color
              ? {
                  backgroundColor: hexToRgba(segment.task.project_color, isHovered ? 0.28 : 0.16) || undefined,
                  borderColor: hexToRgba(segment.task.project_color, isHovered ? 0.68 : 0.5) || undefined,
                  color: hexToRgba(segment.task.project_color, isHovered ? 1 : 0.92) || undefined
                }
              : undefined;
            const showLabel = segment.kind === 'single' || segment.kind === 'start';
            const span = getDaysSpan(segment.range.start, segment.range.end);

              return (
                <div
                  key={`task-bar-${segment.task.id}-${index}`}
                  draggable
                  onDragStart={(e) => {
                    const payload = { taskId: segment.task.id, mode: 'move' as const };
                    e.dataTransfer.setData('text/plain', JSON.stringify(payload));
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggingPayload(payload);
                  }}
                  onDragEnd={() => {
                    setDraggingPayload(null);
                    setDragOverDate(null);
                    setDragNavDirection(null);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskClick?.(segment.task);
                  }}
                  onMouseEnter={() => setHoveredTaskId(segment.task.id)}
                  onMouseLeave={() => setHoveredTaskId((prev) => (prev === segment.task.id ? null : prev))}
                  className={`absolute ${(draggingPayload && draggingPayload.taskId !== segment.task.id) ? 'pointer-events-none' : 'pointer-events-auto'} z-[1] text-sm h-[26px] leading-[26px] border truncate cursor-pointer ${segmentShapeClass} ${colorClass} ${
                    segment.task.status === 'done' ? 'line-through' : ''
                  } ${isHovered ? 'z-[2] brightness-95 saturate-110' : ''}`}
                  style={{
                    top: (rowOffsets[segment.row] || 0) + laneTopOffset + segment.lane * (laneHeight + laneGap),
                    left: `calc(${left}% + 4px)`,
                    width: `calc(${width}% - 8px)`,
                    ...projectTintStyle
                  }}
                >
                  <div className="flex items-center justify-between gap-1.5 px-2">
                    <span className="truncate">
                      {showLabel ? `${segment.task.title}${span > 1 ? ` (${span}天)` : ''}` : ''}
                    </span>
                    {(segment.kind === 'end' || segment.kind === 'single') && onResizeTask ? (
                      <span
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          const payload = { taskId: segment.task.id, mode: 'resize' as const };
                          e.dataTransfer.setData('text/plain', JSON.stringify(payload));
                          e.dataTransfer.effectAllowed = 'move';
                          setDraggingPayload(payload);
                        }}
                        onDragEnd={(e) => {
                          e.stopPropagation();
                          setDraggingPayload(null);
                          setDragOverDate(null);
                          setDragNavDirection(null);
                        }}
                        title="拖拽到目标日期以延长截止"
                        className="text-sm px-1 rounded bg-black/10 hover:bg-black/20"
                      >
                        ⇢
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default TaskCalendar;
