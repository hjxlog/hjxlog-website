import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Work, Blog, Moment } from '@/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface OverviewTabProps {
  user: any;
  works: Work[];
  blogs: Blog[];
  moments: Moment[];
  openWorkForm: () => void;
  openBlogForm: () => void;
  openMomentForm: () => void;
  onViewAllLogs: () => void;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '未知时间';
  const date = new Date(dateString);
  return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

export default function OverviewTab({
  user,
  works,
  blogs,
  moments,
  openWorkForm,
  openBlogForm,
  openMomentForm,
  onViewAllLogs
}: OverviewTabProps) {
  const navigate = useNavigate();

  // 1. 数据统计
  const stats = [
    { label: '总浏览量', value: blogs.reduce((total, blog) => total + blog.views, 0), icon: 'fas fa-eye', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '文章', value: blogs.length, icon: 'fas fa-blog', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: '动态', value: moments.length, icon: 'fas fa-camera', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  // 2. 最近活动 (合并 Blogs, Works, Moments)
  const allActivities = [
    ...blogs.map(b => ({ type: 'blog', date: b.created_at, title: b.title, status: b.published ? '已发布' : '草稿' })),
    ...works.map(w => ({ type: 'work', date: w.created_at || w.date, title: w.title, status: w.status })),
    ...moments.map(m => ({ type: 'moment', date: m.created_at, title: m.content.substring(0, 30) + (m.content.length > 30 ? '...' : ''), status: m.visibility === 'public' ? '公开' : '私密' }))
  ].sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime())
   .slice(0, 5);

  // 3. 内容分布 (Recharts 数据)
  const pieData = [
    { name: '博客文章', value: blogs.length, color: '#10B981' }, // emerald-500
    { name: '作品项目', value: works.length, color: '#3B82F6' }, // blue-500
    { name: '生活动态', value: moments.length, color: '#6366F1' }, // indigo-500
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* 顶部欢迎卡片 - 更加简约现代 */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
        <div className="z-10">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            早安，{user.username} 👋
          </h2>
          <p className="text-slate-500">
            准备好开始今天的创作了吗？您目前共有 <span className="font-bold text-slate-800">{works.length + blogs.length + moments.length}</span> 个内容条目。
          </p>
        </div>
        {/* 快速操作按钮组 */}
        <div className="flex space-x-3 mt-4 md:mt-0 z-10">
          <button onClick={() => openBlogForm()} className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium flex items-center">
            <i className="fas fa-pen mr-2"></i> 写文章
          </button>
          <button onClick={() => openMomentForm()} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium flex items-center">
            <i className="fas fa-camera mr-2"></i> 发动态
          </button>
          <button onClick={() => openWorkForm()} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium flex items-center">
            <i className="fas fa-plus mr-2"></i> 加作品
          </button>
        </div>
        {/* 装饰背景 */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：数据概览与分布 (占2列) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 关键指标卡片 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 ${stat.bg} rounded-full flex items-center justify-center mb-3`}>
                  <i className={`${stat.icon} ${stat.color} text-lg`}></i>
                </div>
                <span className="text-2xl font-bold text-slate-800">{stat.value.toLocaleString()}</span>
                <span className="text-xs text-slate-500 mt-1">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* 内容分布饼图 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-80">
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
              <i className="fas fa-chart-pie text-slate-400 mr-2 text-sm"></i>
              内容分布
            </h3>
            <div className="w-full h-full pb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 右侧：最近动态 (占1列) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full min-h-[500px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <i className="fas fa-history text-slate-400 mr-2 text-sm"></i>
              最新动态
            </h3>
            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
              近 {allActivities.length} 条
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar -mr-2">
            <div className="space-y-1">
              {allActivities.length > 0 ? (
                allActivities.map((activity, index) => (
                  <div 
                    key={index} 
                    className="group relative flex items-start p-3 hover:bg-slate-50 rounded-xl transition-all duration-200 border border-transparent hover:border-slate-100 mb-1 last:mb-0"
                  >
                    {/* 左侧装饰线/点 */}
                    <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-100 group-hover:bg-slate-200 transition-colors hidden sm:block"></div>
                    <div className={`relative z-10 w-2.5 h-2.5 mt-1.5 rounded-full flex-shrink-0 mr-3 ring-4 ring-white group-hover:ring-slate-50 transition-all ${
                      activity.type === 'blog' ? 'bg-emerald-500' : 
                      activity.type === 'work' ? 'bg-blue-500' : 'bg-indigo-500'
                    }`}></div>
                    
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-slate-800 truncate pr-2 group-hover:text-blue-600 transition-colors">
                          {activity.title || '无标题'}
                        </p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap mt-0.5">
                          {formatDate(activity.date).split(' ')[0]}
                        </span>
                      </div>
                      
                      <div className="flex items-center mt-1.5 text-xs text-slate-500 space-x-2">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                          {activity.type === 'blog' ? '文章' : activity.type === 'work' ? '作品' : '动态'}
                        </span>
                        <span className="w-0.5 h-0.5 bg-slate-300 rounded-full"></span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          activity.status === '已发布' || activity.status === '公开' 
                            ? 'bg-green-50 text-green-600 border border-green-100' 
                            : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                    <i className="fas fa-inbox text-xl text-slate-300"></i>
                  </div>
                  <span className="text-sm">暂无活动记录</span>
                </div>
              )}
            </div>
          </div>
          
          <button 
            onClick={onViewAllLogs}
            className="w-full mt-2 pt-3 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors border-t border-slate-50 flex items-center justify-center group"
          >
            查看更多动态
            <i className="fas fa-arrow-right ml-1 text-[10px] transform group-hover:translate-x-1 transition-transform"></i>
          </button>
        </div>
      </div>
    </div>
  );
}