import { ExclamationTriangleIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import type { TaskOverviewStats } from '@/types/task';

interface TaskPulsePanelProps {
  stats: TaskOverviewStats | null;
  onGoTasks?: () => void;
}

export default function TaskPulsePanel({ stats, onGoTasks }: TaskPulsePanelProps) {
  if (!stats) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:rounded-2xl sm:p-6">
        <h3 className="text-base font-semibold text-slate-800 sm:text-lg">任务概况</h3>
        <p className="mt-2 text-sm text-slate-500">统计加载中...</p>
      </div>
    );
  }

  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:rounded-2xl sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="inline-flex items-center text-base font-semibold text-slate-800 sm:text-lg">
          <ListBulletIcon className="mr-1.5 h-5 w-5 text-slate-400 sm:mr-2" />
          任务概况
        </h3>
        <span className="rounded-full bg-slate-50 px-2 py-1 text-xs text-slate-500">总计 {stats.total}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MiniMetric label="待办" value={stats.todo} />
        <MiniMetric label="进行中" value={stats.in_progress} />
        <MiniMetric label="已完成" value={stats.done} />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <AlertPill label="逾期" value={stats.overdue} alert={stats.overdue > 0} />
        <AlertPill label="P0" value={stats.p0} alert={stats.p0 > 0} />
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
          <span>完成率</span>
          <span>{completionRate}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${completionRate}%` }} />
        </div>
      </div>

      <button
        onClick={onGoTasks}
        className="mt-4 inline-flex items-center text-xs font-medium text-slate-500 hover:text-[#165DFF] sm:text-sm"
      >
        进入任务面板 {'->'}
      </button>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-2 text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function AlertPill({ label, value, alert }: { label: string; value: number; alert: boolean }) {
  return (
    <div
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        alert ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-600'
      }`}
    >
      <ExclamationTriangleIcon className="mr-1 h-3.5 w-3.5" />
      {label} {value}
    </div>
  );
}
