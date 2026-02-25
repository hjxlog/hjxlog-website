import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { apiRequest } from '@/config/api';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

interface DailyReportItem {
  id: number;
  report_date: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const formatDate = (date: string) => {
  if (!date) return '';
  return date.slice(0, 10);
};

const normalizeDate = (input: string): string => {
  if (!input) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const parsed = new Date(input);
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return input.includes('T') ? input.slice(0, 10) : input;
};

export default function DailyReportsTab() {
  const [reports, setReports] = useState<DailyReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<DailyReportItem | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiRequest('/api/daily-reports?limit=50&page=1');
      const list = result.data?.reports || [];
      setReports(list);
      setSelectedReport(list[0] || null);
    } catch (error) {
      console.error('获取日报列表失败:', error);
      toast.error('获取日报列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const today = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const displayReports = useMemo(() => {
    return reports.map((report) => ({
      ...report,
      displayDate: normalizeDate(report.report_date)
    }));
  }, [reports]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="h-5 w-5 text-purple-600" />
            <h2 className="text-base font-semibold text-gray-900">日报日期</h2>
          </div>
        </div>

        <div className="max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-sm text-slate-400">加载中...</div>
          ) : displayReports.length === 0 ? (
            <div className="p-4 text-sm text-slate-400">暂无日报</div>
          ) : (
            displayReports.map((report) => {
              const isSelected = selectedReport?.id === report.id;
              const isToday = report.displayDate === today;
              return (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-purple-50 border-l-4 border-l-purple-600' : 'border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${
                          isSelected ? 'text-purple-700' : 'text-gray-900'
                        }`}>
                          {formatDate(report.displayDate)}
                        </span>
                        {isToday && (
                          <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                            今天
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <span>日期：{selectedReport?.report_date ? formatDate(normalizeDate(selectedReport.report_date)) : '-'}</span>
          <span>{selectedReport?.updated_at ? `更新于 ${new Date(selectedReport.updated_at).toLocaleString()}` : ''}</span>
        </div>
        {selectedReport?.content ? (
          <div className="prose prose-sm max-w-none">
            <MarkdownRenderer content={selectedReport.content} />
          </div>
        ) : (
          <div className="text-sm text-slate-400">暂无日报内容</div>
        )}
      </section>
    </div>
  );
}
