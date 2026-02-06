import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/config/api';
import { toast } from 'sonner';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

interface OpenClawTask {
  title: string;
  done?: boolean | null;
  detail?: string;
}

interface OpenClawReport {
  id: number;
  source: string;
  report_date: string;
  title?: string;
  content: string;
  status: 'ok' | 'warning' | 'error';
  tasks?: OpenClawTask[];
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface OpenClawStats {
  total: number;
  last7Days: number;
  byStatus: {
    ok: number;
    warning: number;
    error: number;
  };
}

function formatReportDate(input?: string) {
  if (!input) return '-';
  const datePart = input.includes('T') ? input.slice(0, 10) : input;
  const [year, month, day] = datePart.split('-');
  if (!year || !month || !day) return input;
  return `${year}-${month}-${day}`;
}

function statusTag(status: OpenClawReport['status']) {
  if (status === 'error') return 'bg-red-50 text-red-700 border-red-200';
  if (status === 'warning') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
}

function statusText(status: OpenClawReport['status']) {
  if (status === 'error') return '异常';
  if (status === 'warning') return '警告';
  return '正常';
}

export default function OpenClawReportsTab() {
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [reports, setReports] = useState<OpenClawReport[]>([]);
  const [stats, setStats] = useState<OpenClawStats | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiRequest('/api/openclaw-reports?limit=30&page=1');
      if (result.success) {
        setReports(result.data?.reports || []);
      } else {
        toast.error(result.message || '获取 OpenClaw 汇报失败');
      }
    } catch (error) {
      toast.error('获取 OpenClaw 汇报失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const result = await apiRequest('/api/openclaw-reports/stats');
      if (result.success) {
        setStats(result.data || null);
      }
    } catch {
      // ignore stats errors to avoid blocking list rendering
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
    loadStats();
  }, [loadReports, loadStats]);

  const latestDate = useMemo(() => formatReportDate(reports[0]?.report_date), [reports]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">OpenClaw 每日汇报</h2>
          <p className="text-sm text-slate-500">独立接收 OpenClaw 每日任务回报，不与动态混用。</p>
        </div>
        <button
          onClick={() => {
            loadReports();
            loadStats();
          }}
          disabled={loading || statsLoading}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {loading ? '刷新中...' : '刷新'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">最新汇报日期</div>
          <div className="text-lg font-semibold text-slate-900">{latestDate}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">总汇报数</div>
          <div className="text-lg font-semibold text-slate-900">
            {statsLoading ? '-' : (stats?.total ?? 0)}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">近 7 天汇报</div>
          <div className="text-lg font-semibold text-slate-900">
            {statsLoading ? '-' : (stats?.last7Days ?? 0)}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">状态分布</div>
          <div className="text-sm text-slate-700">
            {statsLoading
              ? '-'
              : `正常 ${stats?.byStatus?.ok ?? 0} / 警告 ${stats?.byStatus?.warning ?? 0} / 异常 ${stats?.byStatus?.error ?? 0}`}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        {loading ? (
          <div className="text-sm text-slate-500">加载中...</div>
        ) : reports.length === 0 ? (
          <div className="text-sm text-slate-600">暂无 OpenClaw 汇报数据。</div>
        ) : (
          <div className="space-y-5">
            {reports.map((report) => (
              <div key={report.id} className="border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs text-slate-500">{report.source}</div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {report.title || `每日汇报 ${report.report_date}`}
                    </h3>
                    <div className="text-xs text-slate-500 mt-1">
                      汇报日期：{formatReportDate(report.report_date)} · 推送时间：{new Date(report.created_at).toLocaleString()}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${statusTag(report.status)}`}>
                    {statusText(report.status)}
                  </span>
                </div>

                {Array.isArray(report.tasks) && report.tasks.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-slate-800">任务清单</div>
                    <ul className="space-y-2">
                      {report.tasks.map((task, index) => (
                        <li key={`${report.id}-${index}`} className="text-sm text-slate-700 flex items-start gap-2">
                          <span className="text-slate-400 mt-0.5">{task.done === true ? '✓' : task.done === false ? '✗' : '•'}</span>
                          <span>{task.title}{task.detail ? `：${task.detail}` : ''}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <MarkdownRenderer content={report.content} className="max-w-none" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
