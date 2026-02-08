import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/config/api';
import { toast } from 'sonner';
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
    } catch (error) {
      toast.error('加载总览失败，请稍后重试');
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
    const highPriority = active.filter((task) => task.priority === 'P0' || task.priority === 'P1').length;
    return { active: active.length, overdue, dueToday, highPriority };
  }, [tasks]);

  const riskItems = useMemo(() => {
    const items: Array<{ label: string; level: 'danger' | 'warning' | 'normal'; action: () => void }> = [];

    if (taskSummary.overdue > 0) {
      items.push({ label: `存在 ${taskSummary.overdue} 个逾期任务`, level: 'danger', action: onGoTasks });
    }

    if (taskSummary.dueToday > 0) {
      items.push({ label: `今天有 ${taskSummary.dueToday} 个到期任务`, level: 'warning', action: onGoTasks });
    }

    if (latestReport?.status === 'error' || latestReport?.status === 'warning') {
      items.push({ label: `OpenClaw 状态为 ${latestReport.status}`, level: 'warning', action: onGoReports });
    }

    if (items.length === 0) {
      items.push({ label: '当前没有高优先级告警', level: 'normal', action: onGoTasks });
    }

    return items.slice(0, 3);
  }, [taskSummary.overdue, taskSummary.dueToday, latestReport?.status, onGoReports, onGoTasks]);

  const totalContent = worksCount + blogsCount + momentsCount;
  const digestTopItems = useMemo(() => (latestDigest?.items || []).slice(0, 3), [latestDigest]);
  const latestWorks = useMemo(() => [...works].slice(0, 3), [works]);
  const latestBlogs = useMemo(() => [...blogs].slice(0, 3), [blogs]);
  const latestMoments = useMemo(() => [...moments].slice(0, 3), [moments]);
  const draftBlogsCount = useMemo(() => blogs.filter((blog) => !blog.published).length, [blogs]);

  const getRiskStyle = (level: 'danger' | 'warning' | 'normal') => {
    if (level === 'danger') return 'border-red-200 bg-red-50 text-red-700';
    if (level === 'warning') return 'border-amber-200 bg-amber-50 text-amber-700';
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <p className="text-sm text-slate-500">正在加载中枢总览...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">中枢总览 · {username}</h2>
            <p className="text-sm text-slate-500 mt-1">这是整个 Dashboard 的信息统计窗口和快速发起窗口。</p>
          </div>
          <button onClick={loadHubData} className="px-3 py-2 text-sm font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50">刷新总览</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-sm text-slate-500">内容总量</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{totalContent}</div>
          <div className="text-xs text-slate-500 mt-1">作品 {worksCount} · 博客 {blogsCount} · 动态 {momentsCount}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-sm text-slate-500">活跃待办</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{taskSummary.active}</div>
          <button onClick={onGoTasks} className="text-xs text-blue-600 hover:underline mt-2">查看任务</button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-sm text-slate-500">OpenClaw 最新状态</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{latestReport?.status || '-'}</div>
          <div className="text-xs text-slate-500 mt-1">{latestReport?.report_date || '暂无数据'}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-sm text-slate-500">情报雷达条目</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{latestDigest?.items?.length || 0}</div>
          <div className="text-xs text-slate-500 mt-1">{latestDigest?.digest_date || '暂无简报'}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">风险与提醒</h3>
          <button onClick={onGoTasks} className="text-xs text-blue-600 hover:underline">去处理</button>
        </div>
        <div className="space-y-2">
          {riskItems.map((item, index) => (
            <button
              key={`${item.label}-${index}`}
              onClick={item.action}
              className={`w-full text-left rounded-lg border px-3 py-2 text-sm ${getRiskStyle(item.level)}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <h3 className="text-base font-semibold text-slate-900">快速发起</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button onClick={onOpenWorkForm} className="px-3 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">新建作品</button>
            <button onClick={onOpenBlogForm} className="px-3 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">写博客</button>
            <button onClick={onOpenMomentForm} className="px-3 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">发动态</button>
            <button onClick={onGoTasks} className="px-3 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">新建任务</button>
            <button onClick={onGoThoughts} className="px-3 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">记录想法</button>
            <button onClick={onGoSignal} className="px-3 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">查看雷达</button>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <h3 className="text-base font-semibold text-slate-900">模块跳转</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button onClick={onGoTasks} className="px-3 py-2 text-sm rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100">待办事项</button>
            <button onClick={onGoReports} className="px-3 py-2 text-sm rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100">OpenClaw汇报</button>
            <button onClick={onGoSignal} className="px-3 py-2 text-sm rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100">情报雷达</button>
            <button onClick={onGoWorks} className="px-3 py-2 text-sm rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200">作品管理</button>
            <button onClick={onGoBlogs} className="px-3 py-2 text-sm rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200">博客管理</button>
            <button onClick={onGoMoments} className="px-3 py-2 text-sm rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200">动态管理</button>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">最新状态摘要</h3>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="text-xs text-slate-500">OpenClaw 最新汇报</div>
              {latestReport ? (
                <>
                  <div className="text-sm font-medium text-slate-900 mt-1">{latestReport.title || `汇报 ${latestReport.report_date}`}</div>
                  <div className="text-xs text-slate-500 mt-1">状态 {latestReport.status}</div>
                  <p className="text-sm text-slate-700 leading-6 mt-2 line-clamp-4">{stripMarkdown(latestReport.content).slice(0, 220)}</p>
                </>
              ) : (
                <div className="text-sm text-slate-500 mt-2">暂无汇报记录</div>
              )}
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="text-xs text-slate-500">情报雷达 Top3</div>
              {digestTopItems.length === 0 ? (
                <div className="text-sm text-slate-500 mt-2">暂无可用情报</div>
              ) : (
                <div className="space-y-2 mt-2">
                  {digestTopItems.map((item) => (
                    <div key={item.itemId} className="rounded border border-slate-100 px-2 py-1.5">
                      <div className="text-sm text-slate-900 line-clamp-2">{item.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{item.source} · 分数 {item.score?.toFixed(2) || '0.00'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">内容管理预览</h3>
            <div className="text-xs text-slate-500">博客草稿 {draftBlogsCount} 篇</div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="text-sm font-medium text-slate-900 mb-2">最新作品</div>
              <div className="space-y-2">
                {latestWorks.length === 0 ? (
                  <div className="text-sm text-slate-500">暂无作品</div>
                ) : (
                  latestWorks.map((item) => (
                    <div key={item.id} className="text-sm text-slate-700 line-clamp-2">{item.title}</div>
                  ))
                )}
              </div>
              <button onClick={onGoWorks} className="text-xs text-blue-600 hover:underline mt-3">进入作品管理</button>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <div className="text-sm font-medium text-slate-900 mb-2">最新博客</div>
              <div className="space-y-2">
                {latestBlogs.length === 0 ? (
                  <div className="text-sm text-slate-500">暂无博客</div>
                ) : (
                  latestBlogs.map((item) => (
                    <div key={item.id} className="text-sm text-slate-700 line-clamp-2">
                      {item.title}
                      {!item.published ? <span className="ml-1 text-xs text-amber-600">(草稿)</span> : null}
                    </div>
                  ))
                )}
              </div>
              <button onClick={onGoBlogs} className="text-xs text-blue-600 hover:underline mt-3">进入博客管理</button>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <div className="text-sm font-medium text-slate-900 mb-2">最新动态</div>
              <div className="space-y-2">
                {latestMoments.length === 0 ? (
                  <div className="text-sm text-slate-500">暂无动态</div>
                ) : (
                  latestMoments.map((item) => (
                    <div key={item.id} className="text-sm text-slate-700 line-clamp-2">{item.content}</div>
                  ))
                )}
              </div>
              <button onClick={onGoMoments} className="text-xs text-blue-600 hover:underline mt-3">进入动态管理</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
