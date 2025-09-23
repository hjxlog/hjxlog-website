import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Work {
  id: number;
  title: string;
  description: string;
  content?: string;
  category: string;
  status: string;
  tags: string[];
  technologies: string[];
  project_url: string;
  github_url: string;
  cover_image: string;
  screenshots?: string[];
  features?: string[];
  challenges?: string[];
  featured: boolean;
  created_at: string;
  updated_at: string;
  date?: string;
}

interface Blog {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  published: boolean;
  featured: boolean;
  cover_image?: string;
  views: number;
  likes: number;
  created_at: string;
  updated_at: string;
}

interface OverviewTabProps {
  user: any;
  works: Work[];
  blogs: Blog[];
  moments: any[];
  openWorkForm: () => void;
  openBlogForm: () => void;
  openMomentForm: () => void;
}

export default function OverviewTab({
  user,
  works,
  blogs,
  moments,
  openWorkForm,
  openBlogForm,
  openMomentForm
}: OverviewTabProps) {
  const navigate = useNavigate();

  return (
    <div>
      {/* 控制台页面 */}
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">控制台</h2>
        <p className="text-sm sm:text-base text-slate-600">欢迎回来，{user.username}！</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
        <div className="bg-white rounded-xl p-3 sm:p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs sm:text-sm">总作品数</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800">{works.length}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-briefcase text-blue-600 text-sm sm:text-base"></i>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-3 sm:p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs sm:text-sm">总博客数</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800">{blogs.length}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-blog text-green-600 text-sm sm:text-base"></i>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-3 sm:p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs sm:text-sm">总动态数</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800">{moments.length}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-camera text-indigo-600 text-sm sm:text-base"></i>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-3 sm:p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs sm:text-sm">已发布博客</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800">
                {blogs.filter(blog => blog.published).length}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-eye text-purple-600 text-sm sm:text-base"></i>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-3 sm:p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs sm:text-sm">总浏览量</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800">
                {blogs.reduce((total, blog) => total + blog.views, 0)}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-chart-line text-orange-600 text-sm sm:text-base"></i>
            </div>
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="bg-white rounded-xl p-3 sm:p-4 md:p-6 shadow-sm">
        <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">快速操作</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
          <button
            onClick={() => openWorkForm()}
            className="p-2 sm:p-3 md:p-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-[#165DFF] hover:bg-[#165DFF]/5 transition-colors text-center"
          >
            <i className="fas fa-plus text-lg sm:text-xl md:text-2xl text-slate-400 mb-1 sm:mb-2"></i>
            <p className="text-xs sm:text-sm md:text-base text-slate-600">添加新作品</p>
          </button>
          
          <button
            onClick={() => openBlogForm()}
            className="p-2 sm:p-3 md:p-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-[#165DFF] hover:bg-[#165DFF]/5 transition-colors text-center"
          >
            <i className="fas fa-plus text-lg sm:text-xl md:text-2xl text-slate-400 mb-1 sm:mb-2"></i>
            <p className="text-xs sm:text-sm md:text-base text-slate-600">添加新博客</p>
          </button>
          
          <button
            onClick={() => openMomentForm()}
            className="p-2 sm:p-3 md:p-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-[#165DFF] hover:bg-[#165DFF]/5 transition-colors text-center"
          >
            <i className="fas fa-plus text-lg sm:text-xl md:text-2xl text-slate-400 mb-1 sm:mb-2"></i>
            <p className="text-xs sm:text-sm md:text-base text-slate-600">发布动态</p>
          </button>
          
          <button
            onClick={() => window.open('/', '_blank')}
            className="p-2 sm:p-3 md:p-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-[#165DFF] hover:bg-[#165DFF]/5 transition-colors text-center"
          >
            <i className="fas fa-home text-lg sm:text-xl md:text-2xl text-slate-400 mb-1 sm:mb-2"></i>
            <p className="text-xs sm:text-sm md:text-base text-slate-600">查看网站</p>
          </button>
          
          <button
            onClick={() => navigate('/profile')}
            className="p-2 sm:p-3 md:p-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-[#165DFF] hover:bg-[#165DFF]/5 transition-colors text-center"
          >
            <i className="fas fa-user text-lg sm:text-xl md:text-2xl text-slate-400 mb-1 sm:mb-2"></i>
            <p className="text-xs sm:text-sm md:text-base text-slate-600">个人设置</p>
          </button>
        </div>
      </div>
    </div>
  );
}