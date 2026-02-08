import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/config/api';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  BoltIcon,
  RocketLaunchIcon,
  ClipboardDocumentListIcon,
  ChartBarSquareIcon
} from '@heroicons/react/24/outline';
import type { Blog, Moment, Work } from '@/types';
import type { Task } from '@/types/task';

interface OpenClawReport {
  id: number;
  report_date: string;
  title?: string;
  content: string;
  status: 'ok' | 'warning' | 'error';
}

interface DigestItem {
  itemId: number;
  title: string;
  score: number;
  source: string;
}

interface DailyDigest {
  id: number;
  digest_date: string;
  status: 'ready' | 'empty' | 'error';
  summary_text?: string;
  items: DigestItem[];
}

interface TodayHubTabProps {
  username: string;
  totalViews: number;
  worksCount: number;
  blogsCount: number;
  momentsCount: number;
  works: Work[];
  blogs: Blog[];
  moments: Moment[];
  onGoTasks: () => void;
  onGoThoughts: () => void;
  onGoReports: () => void;
  onGoSignal: () => void;
  onGoWorks: () => void;
  onGoBlogs: () => void;
  onGoMoments: () => void;
  onOpenWorkForm: () => void;
  onOpenBlogForm: () => void;
  onOpenMomentForm: () => void;
}

const toDateString = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getToday = () => toDateString(new Date().toISOString());
const stripMarkdown = (text: string) => text.replace(/[#*_>`\-]/g, ' ').replace(/\s+/g, ' ').trim();

export default function TodayHubTab({
  username,
  totalViews,
  worksCount,
  blogsCount,
  momentsCount,
  works,
  blogs,
  moments,
  onGoTasks,
  onGoThoughts,
  onGoReports,
  onGoSignal,
  onGoWorks,
  onGoBlogs,
  onGoMoments,
  onOpenWorkForm,
  onOpenBlogForm,
  onOpenMomentForm
}: TodayHubTabProps) {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [latestReport, setLatestReport] = useState<OpenClawReport | null>(null);
  const [latestDigest, setLatestDigest] = useState<DailyDigest | null>(null);

  const loadHubData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, reportRes, digestRes] = await Promise.all([
        apiRequest('/api/tasks'),
        apiRequest('/api/openclaw-reports/latest'),
        apiRequest('/api/ai-signal/digest/latest')
      ]);
      setTasks(tasksRes?.data || []);
      setLatestReport(reportRes?.data || null);
      setLatestDigest(digestRes?.data || null);
    } catch {
      toast.error('加载中枢总览失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHubData();
  }, [loadHubData]);

  const taskSummary = useMemo(() => {
    const today = getToday();
    const active = tasks.filter((task) => task.status !== 'done');
    const overdue = active.filter((task) => task.due_date && toDateString(task.due_date) < today).length;
    const dueToday = active.filter((task) => task.due_date && toDateString(task.due_date) === today).length;
    const inProgress = active.filter((task) => task.status === 'in_progress').length;
    const done = tasks.filter((task) => task.status === 'done').length;
    return { active: active.length, overdue, dueToday, inProgress, done };
  }, [tasks]);

  const pieData = useMemo(
    () =>
      [
        { name: '博客', value: blogsCount, color: '#0ea5e9' },
        { name: '作品', value: worksCount, color: '#22c55e' },
        { name: '动态', value: momentsCount, color: '#f97316' }
      ].filter((item) => item.value > 0),
    [blogsCount, worksCount, momentsCount]
  );

  const digestTopItems = useMemo(() => (latestDigest?.items || []).slice(0, 4), [latestDigest]);
  const draftBlogsCount = useMemo(() => blogs.filter((blog) => !blog.published).length, [blogs]);
  const privateMomentsCount = useMemo(() => moments.filter((moment) => moment.visibility !== 'public').length, [moments]);

  const recentActivities = useMemo(() => {
    return [
      ...blogs.map((item) => ({
        id: `blog-${item.id}`,
        type: '博客',
        title: item.title,
        status: item.published ? '已发布' : '草稿',
        date: item.created_at || ''
      })),
      ...works.map((item) => ({
        id: `work-${item.id}`,
        type: '作品',
        title: item.title,
        status: item.status || '未知',
        date: item.created_at || item.date || ''
      })),
      ...moments.map((item) => ({
        id: `moment-${item.id}`,
        type: '动态',
        title: item.content,
        status: item.visibility === 'public' ? '公开' : '私密',
        date: item.created_at || ''
      }))
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 12);
  }, [blogs, works, moments]);

  const riskItems = useMemo(() => {
    const items: Array<{ label: string; tone: 'danger' | 'warn' | 'ok'; action: () => void }> = [];

    if (taskSummary.overdue > 0) {
      items.push({ label: `${taskSummary.overdue} 个任务已逾期`, tone: 'danger', action: onGoTasks });
    }
    if (taskSummary.dueToday > 0) {
      items.push({ label: `${taskSummary.dueToday} 个任务今天到期`, tone: 'warn', action: onGoTasks });
    }
    if (latestReport?.status === 'warning' || latestReport?.status === 'error') {
      items.push({ label: `OpenClaw 状态异常（${latestReport.status}）`, tone: 'warn', action: onGoReports });
    }
    if (items.length === 0) {
      items.push({ label: '当前没有高优先级风险', tone: 'ok', action: onGoTasks });
    }

    return items;
  }, [latestReport?.status, onGoReports, onGoTasks, taskSummary.dueToday, taskSummary.overdue]);

  const toneClass = (tone: 'danger' | 'warn' | 'ok') => {
    if (tone === 'danger') return 'border-red-200 bg-red-50 text-red-700';
    if (tone === 'warn') return 'border-amber-200 bg-amber-50 text-amber-700';
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">正在加载中枢总览...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="flex min-h-12 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-base font-semibold text-slate-900">中枢总览</p>
              <p className="text-xs text-slate-500">欢迎回来，{username}</p>
            </div>
            <div className="hidden lg:flex items-center gap-2">
              <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">逾期 {taskSummary.overdue}</span>
              <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">今日到期 {taskSummary.dueToday}</span>
              <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">草稿 {draftBlogsCount}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={onOpenWorkForm} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">新建作品</button>
            <button onClick={onOpenBlogForm} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">写博客</button>
            <button onClick={onOpenMomentForm} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">发动态</button>
            <button
              onClick={loadHubData}
              className="inline-flex items-center rounded-lg bg-[#165DFF] px-3 py-1.5 text-xs text-white hover:bg-[#0E4BA4]"
            >
              <ArrowPathIcon className="mr-1 h-3.5 w-3.5" /> 刷新
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatCard title="总浏览量" value={totalViews} />
        <StatCard title="内容总量" value={worksCount + blogsCount + momentsCount} />
        <StatCard title="活跃任务" value={taskSummary.active} />
        <StatCard title="进行中" value={taskSummary.inProgress} />
        <StatCard title="博客草稿" value={draftBlogsCount} />
        <StatCard title="私密动态" value={privateMomentsCount} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <Panel title="风险提醒" icon={<ExclamationTriangleIcon className="h-4 w-4" />} actionLabel="任务面板" onAction={onGoTasks}>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {riskItems.map((item, idx) => (
                <button
                  key={`${item.label}-${idx}`}
                  onClick={item.action}
                  className={`rounded-xl border px-3 py-2 text-left text-sm ${toneClass(item.tone)}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="内容活动流" icon={<ClipboardDocumentListIcon className="h-4 w-4" />} actionLabel="进入内容管理" onAction={onGoBlogs}>
            <div className="max-h-72 space-y-2 overflow-auto pr-1">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-slate-500">暂无活动记录</p>
              ) : (
                recentActivities.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-1 text-sm font-medium text-slate-900">{item.title}</p>
                      <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-600">{item.type}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{item.status} · {toDateString(item.date) || '未知时间'}</p>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-4 xl:col-span-4">
          <Panel title="AI与汇报" icon={<RocketLaunchIcon className="h-4 w-4" />} actionLabel="查看详情" onAction={onGoReports}>
            <div className="space-y-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">OpenClaw</p>
                <p className="mt-1 line-clamp-1 text-sm font-medium text-slate-900">{latestReport?.title || '暂无汇报'}</p>
                <p className="mt-1 text-xs text-slate-500">状态 {latestReport?.status || '-'} · {latestReport?.report_date || '-'}</p>
                {latestReport?.content ? (
                  <p className="mt-2 line-clamp-2 text-xs text-slate-600">{stripMarkdown(latestReport.content)}</p>
                ) : null}
              </div>
              <div className="max-h-40 space-y-2 overflow-auto pr-1">
                {digestTopItems.length === 0 ? (
                  <p className="text-sm text-slate-500">暂无雷达条目</p>
                ) : (
                  digestTopItems.map((item) => (
                    <button
                      key={item.itemId}
                      onClick={onGoSignal}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <p className="line-clamp-2 text-sm text-slate-900">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.source} · {item.score?.toFixed(2) || '0.00'}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </Panel>

          <Panel title="内容分布" icon={<ChartBarSquareIcon className="h-4 w-4" />}>
            {pieData.length === 0 ? (
              <p className="text-sm text-slate-500">暂无内容数据</p>
            ) : (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="48%" innerRadius={34} outerRadius={54} paddingAngle={4}>
                      {pieData.map((entry, idx) => (
                        <Cell key={`pie-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>
        </div>
      </section>

      <details className="rounded-2xl border border-slate-200 bg-white p-4" open>
        <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">内容预览与快速入口</summary>
        <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-8">
          <QuickButton label="待办事项" onClick={onGoTasks} variant="primary" />
          <QuickButton label="每日想法" onClick={onGoThoughts} variant="primary" />
          <QuickButton label="OpenClaw 汇报" onClick={onGoReports} variant="primary" />
          <QuickButton label="情报雷达" onClick={onGoSignal} variant="primary" />
          <QuickButton label="作品管理" onClick={onGoWorks} />
          <QuickButton label="博客管理" onClick={onGoBlogs} />
          <QuickButton label="动态管理" onClick={onGoMoments} />
          <QuickButton label="发动态" onClick={onOpenMomentForm} />
        </div>
      </details>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Panel({
  title,
  icon,
  actionLabel,
  onAction,
  children
}: {
  title: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-900">
          {icon}
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        {actionLabel && onAction ? (
          <button onClick={onAction} className="text-xs text-blue-600 hover:underline">{actionLabel}</button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function QuickButton({ label, onClick, variant = 'default' }: { label: string; onClick: () => void; variant?: 'default' | 'primary' }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
        variant === 'primary'
          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  );
}
