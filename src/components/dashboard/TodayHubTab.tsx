import { useCallback, useMemo } from 'react';
import { API_BASE_URL } from '@/config/api';
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

interface TodayHubTabProps {
  username: string;
  totalViews: number;
  works: Work[];
  blogs: Blog[];
  moments: Moment[];
  onOpenWorkForm: () => void;
  onOpenBlogForm: () => void;
  onOpenMomentForm: () => void;
  onGoMoments: () => void;
}

const toDisplayDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getMonth() + 1}-${date.getDate()}`;
};

export default function TodayHubTab({
  username,
  totalViews,
  works,
  blogs,
  moments,
  onOpenWorkForm,
  onOpenBlogForm,
  onOpenMomentForm,
  onGoMoments
}: TodayHubTabProps) {
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
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">晚上好，{username} 👋</h2>
            <p className="mt-2 text-slate-500">准备好开始今天的创作了吗？您目前共有 <span className="font-bold text-slate-700">{totalContent}</span> 个内容条目。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onOpenBlogForm}
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <PencilSquareIcon className="mr-1.5 h-4 w-4" />
              写文章
            </button>
            <button
              onClick={onOpenMomentForm}
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <CameraIcon className="mr-1.5 h-4 w-4" />
              发动态
            </button>
            <button
              onClick={onOpenWorkForm}
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <PlusIcon className="mr-1.5 h-4 w-4" />
              加作品
            </button>
            <button
              onClick={handleExportAll}
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <CircleStackIcon className="mr-1.5 h-4 w-4" />
              数据备份
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h3 className="mb-4 inline-flex items-center text-lg font-semibold text-slate-800">
              <ChartPieIcon className="mr-2 h-5 w-5 text-slate-400" />
              内容分布
            </h3>
            <div className="h-64">
              {pieData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">暂无内容数据</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="48%"
                      innerRadius={72}
                      outerRadius={96}
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
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
              {pieData.map((item) => (
                <div key={item.name} className="inline-flex items-center text-slate-600">
                  <span className="mr-1.5 h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="inline-flex items-center text-lg font-semibold text-slate-800">
                <ClockIcon className="mr-2 h-5 w-5 text-slate-400" />
                最新动态
              </h3>
              <span className="rounded-full bg-slate-50 px-2 py-1 text-xs text-slate-400">近 {recentActivities.length} 条</span>
            </div>

            <div className="mt-4 space-y-4">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-slate-500">暂无动态</p>
              ) : (
                recentActivities.map((item) => (
                  <div key={item.id} className="relative pl-6">
                    <span className="absolute left-0 top-2 h-2.5 w-2.5 rounded-full bg-indigo-500" />
                    <span className="absolute left-1 top-5 h-[calc(100%-8px)] w-px bg-slate-200" />
                    <div className="flex items-start justify-between gap-3">
                      <p className="line-clamp-1 text-base font-semibold text-slate-800">{item.title}</p>
                      <span className="text-sm text-slate-400">{toDisplayDate(item.date)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
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
              className="mt-6 inline-flex items-center text-sm font-medium text-slate-500 hover:text-[#165DFF]"
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${iconBg} ${iconColor}`}>
        {icon}
      </div>
      <p className="mt-4 text-center text-3xl font-bold text-slate-800">{value}</p>
      <p className="mt-1 text-center text-slate-500">{label}</p>
    </div>
  );
}
