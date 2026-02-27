import { useCallback, useMemo, useEffect, useState } from 'react';
import { API_BASE_URL, apiRequest } from '@/config/api';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  CameraIcon,
  EyeIcon,
  PencilSquareIcon,
  PlusIcon,
  CircleStackIcon,
  ClockIcon,
  ChartPieIcon,
  RssIcon
} from '@heroicons/react/24/outline';
import type { Blog, Moment, Work } from '@/types';
import type { TaskOverviewStats } from '@/types/task';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import TaskPulsePanel from '@/components/dashboard/TaskPulsePanel';

interface TodayHubTabProps {
  username: string;
  totalViews: number;
  works: Work[];
  blogs: Blog[];
  moments: Moment[];
  taskStats: TaskOverviewStats | null;
  onOpenWorkForm: () => void;
  onOpenBlogForm: () => void;
  onOpenMomentForm: () => void;
  onGoMoments: () => void;
  onGoTasks?: () => void;
}

const toDisplayDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getMonth() + 1}-${date.getDate()}`;
};

const getLocalToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function TodayHubTab({
  username,
  totalViews,
  works,
  blogs,
  moments,
  taskStats,
  onOpenWorkForm,
  onOpenBlogForm,
  onOpenMomentForm,
  onGoMoments,
  onGoTasks
}: TodayHubTabProps) {
  const [selectedReportDate] = useState<string>(getLocalToday());
  const [reportContent, setReportContent] = useState('');
  const [reportUpdatedAt, setReportUpdatedAt] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const totalContent = works.length + blogs.length + moments.length;

  const pieData = useMemo(
    () => [
      { name: '博客文章', value: blogs.length, color: '#10b981' },
      { name: '生活动态', value: moments.length, color: '#6366f1' },
      { name: '作品项目', value: works.length, color: '#3b82f6' }
    ].filter((item) => item.value > 0),
    [blogs.length, moments.length, works.length]
  );

  const recentActivities = useMemo(() => {
    return [
      ...moments.map((item) => ({
        id: `moment-${item.id}`,
        title: item.content,
        type: '动态',
        status: item.visibility === 'public' ? '公开' : '私密',
        date: item.created_at || ''
      })),
      ...blogs.map((item) => ({
        id: `blog-${item.id}`,
        title: item.title,
        type: '博客',
        status: item.published ? '已发布' : '草稿',
        date: item.created_at || ''
      })),
      ...works.map((item) => ({
        id: `work-${item.id}`,
        title: item.title,
        type: '作品',
        status: item.status || '未知',
        date: item.created_at || item.date || ''
      }))
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [blogs, moments, works]);

  const fetchReportByDate = useCallback(async (date: string) => {
    try {
      setLoadingReport(true);
      const data = await apiRequest(`/api/daily-reports/${date}`);
      const report = data.data;
      setReportContent(report?.content || '');
      setReportUpdatedAt(report?.updated_at || null);
    } catch (error) {
      console.error('获取日报失败:', error);
      toast.error('获取日报失败');
    } finally {
      setLoadingReport(false);
    }
  }, []);

  const handleGenerateReport = useCallback(async () => {
    try {
      setGeneratingReport(true);
      const data = await apiRequest('/api/daily-reports/today/generate', { method: 'POST' });
      const report = data.data;
      setReportContent(report?.content || '');
      setReportUpdatedAt(report?.updated_at || null);
      toast.success('今日日报已生成');
    } catch (error) {
      console.error('生成日报失败:', error);
      toast.error('生成日报失败');
    } finally {
      setGeneratingReport(false);
    }
  }, []);

  useEffect(() => {
    fetchReportByDate(selectedReportDate);
  }, [selectedReportDate, fetchReportByDate]);

  const handleExportAll = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/export/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('导出失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `full_backup_${new Date().toISOString().slice(0, 10)}.sql`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
      toast.success('数据备份下载成功');
    } catch {
      toast.error('数据备份失败');
    }
  }, []);

  return (
    <div className="space-y-3 sm:space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:rounded-2xl sm:p-6">
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 sm:text-2xl">晚上好，{username} 👋</h2>
            <p className="mt-1.5 text-sm text-slate-500 sm:mt-2 sm:text-base">
              准备好开始今天的创作了吗？您目前共有 <span className="font-bold text-slate-700">{totalContent}</span> 个内容条目。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <button
              onClick={onOpenBlogForm}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 sm:rounded-xl sm:px-4 sm:text-sm"
            >
              <PencilSquareIcon className="mr-1 h-4 w-4 sm:mr-1.5" />
              写文章
            </button>
            <button
              onClick={onOpenMomentForm}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:rounded-xl sm:px-4 sm:text-sm"
            >
              <CameraIcon className="mr-1 h-4 w-4 sm:mr-1.5" />
              发动态
            </button>
            <button
              onClick={onOpenWorkForm}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:rounded-xl sm:px-4 sm:text-sm"
            >
              <PlusIcon className="mr-1 h-4 w-4 sm:mr-1.5" />
              加作品
            </button>
            <button
              onClick={handleExportAll}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:rounded-xl sm:px-4 sm:text-sm"
            >
              <CircleStackIcon className="mr-1 h-4 w-4 sm:mr-1.5" />
              数据备份
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
            <StatCard
              icon={<EyeIcon className="h-6 w-6" />}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
              value={String(totalViews)}
              label="总浏览量"
            />
            <StatCard
              icon={<RssIcon className="h-6 w-6" />}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
              value={String(blogs.length)}
              label="文章"
            />
            <StatCard
              icon={<CameraIcon className="h-6 w-6" />}
              iconBg="bg-indigo-100"
              iconColor="text-indigo-600"
              value={String(moments.length)}
              label="动态"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:rounded-2xl sm:p-6">
            <h3 className="mb-3 inline-flex items-center text-base font-semibold text-slate-800 sm:mb-4 sm:text-lg">
              <ChartPieIcon className="mr-1.5 h-5 w-5 text-slate-400 sm:mr-2" />
              内容分布
            </h3>
            <div className="h-52 sm:h-64">
              {pieData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">暂无内容数据</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius="52%"
                      outerRadius="78%"
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs sm:gap-4 sm:text-sm">
              {pieData.map((item) => (
                <div key={item.name} className="inline-flex items-center text-slate-600">
                  <span className="mr-1.5 h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:rounded-2xl sm:p-6">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center text-base font-semibold text-slate-800 sm:text-lg">
                  <ClockIcon className="mr-1.5 h-5 w-5 text-slate-400 sm:mr-2" />
                  今日日报
                </h3>
                <button
                  onClick={handleGenerateReport}
                  className="whitespace-nowrap inline-flex items-center rounded-lg bg-[#165DFF] px-3 py-2 text-xs font-medium text-white hover:bg-[#0E4BA4] disabled:opacity-60 sm:rounded-xl sm:px-4 sm:text-sm"
                  disabled={generatingReport}
                >
                  {generatingReport ? '生成中...' : '生成今日日报'}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">汇总当日任务与想法，生成简洁日报</p>
            </div>

            <div className="mt-4">
              <div className="min-h-[120px] rounded-lg border border-slate-200 bg-white p-3 sm:min-h-[140px] sm:rounded-xl sm:p-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <span>日期：{selectedReportDate}</span>
                  <span>{reportUpdatedAt ? `更新于 ${new Date(reportUpdatedAt).toLocaleString()}` : '尚未生成'}</span>
                </div>
                {loadingReport ? (
                  <div className="text-sm text-slate-400">加载中...</div>
                ) : reportContent ? (
                  <div className="prose prose-sm max-w-none max-h-48 overflow-y-auto pr-1 sm:max-h-56">
                    <MarkdownRenderer content={reportContent} />
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">暂无日报内容</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 xl:col-span-4">
          <TaskPulsePanel stats={taskStats} onGoTasks={onGoTasks} />

          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:rounded-2xl sm:p-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="inline-flex items-center text-base font-semibold text-slate-800 sm:text-lg">
                <ClockIcon className="mr-1.5 h-5 w-5 text-slate-400 sm:mr-2" />
                最新动态
              </h3>
              <span className="rounded-full bg-slate-50 px-2 py-1 text-xs text-slate-400">近 {recentActivities.length} 条</span>
            </div>

            <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-slate-500">暂无动态</p>
              ) : (
                recentActivities.map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-100 bg-slate-50/40 p-2.5 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:relative sm:pl-6">
                    <span className="hidden sm:absolute sm:left-0 sm:top-2 sm:block sm:h-2.5 sm:w-2.5 sm:rounded-full sm:bg-indigo-500" />
                    <span className="hidden sm:absolute sm:left-1 sm:top-5 sm:block sm:h-[calc(100%-8px)] sm:w-px sm:bg-slate-200" />
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <p className="line-clamp-1 text-sm font-semibold text-slate-800 sm:text-base">{item.title}</p>
                      <span className="text-xs text-slate-400 sm:text-sm">{toDisplayDate(item.date)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 sm:mt-1 sm:gap-2">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{item.type}</span>
                      <span className={`rounded px-2 py-0.5 text-xs ${item.status === '公开' || item.status === '已发布' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={onGoMoments}
              className="mt-4 inline-flex items-center text-xs font-medium text-slate-500 hover:text-[#165DFF] sm:mt-6 sm:text-sm"
            >
              查看更多动态 {'->'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  iconBg,
  iconColor,
  value,
  label
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 sm:rounded-2xl sm:p-5">
      <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full ${iconBg} ${iconColor} sm:h-12 sm:w-12`}>
        {icon}
      </div>
      <p className="mt-2.5 text-center text-xl font-bold text-slate-800 sm:mt-4 sm:text-3xl">{value}</p>
      <p className="mt-0.5 text-center text-xs text-slate-500 sm:mt-1 sm:text-base">{label}</p>
    </div>
  );
}
