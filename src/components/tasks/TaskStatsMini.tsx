import { useState } from 'react';
import type { TaskOverviewStats } from '@/types/task';

interface TaskStatsMiniProps {
  stats: TaskOverviewStats;
  compactInHeader?: boolean;
  className?: string;
}

export default function TaskStatsMini({ stats, compactInHeader = false, className = '' }: TaskStatsMiniProps) {
  const [expanded, setExpanded] = useState(false);

  const items = [
    { label: '待办', value: stats.todo, tone: 'text-slate-700 bg-slate-100' },
    { label: '进行中', value: stats.in_progress, tone: 'text-blue-700 bg-blue-100' },
    { label: '逾期', value: stats.overdue, tone: 'text-rose-700 bg-rose-100' }
  ];

  if (compactInHeader) {
    return (
      <div className={`min-w-0 ${className}`}>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="sm:hidden inline-flex h-9 items-center rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700"
        >
          任务统计
          <span className="ml-1.5 text-[11px] text-slate-500">{expanded ? '收起' : '展开'}</span>
        </button>

        {expanded && (
          <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1 sm:hidden">
            {items.map((item) => (
              <StatPill key={item.label} label={item.label} value={item.value} tone={item.tone} />
            ))}
          </div>
        )}

        <div className="hidden sm:flex items-center gap-2 overflow-x-auto">
          {items.map((item) => (
            <StatPill key={item.label} label={item.label} value={item.value} tone={item.tone} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`mt-2 flex items-center gap-2 overflow-x-auto pb-1 ${className}`}>
      {items.map((item) => (
        <StatPill key={item.label} label={item.label} value={item.value} tone={item.tone} />
      ))}
    </div>
  );
}

function StatPill({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`shrink-0 inline-flex h-9 items-center rounded-full px-3 text-xs font-medium ${tone}`}>
      <span>{label}</span>
      <span className="ml-1.5 text-sm font-semibold">{value}</span>
    </div>
  );
}
