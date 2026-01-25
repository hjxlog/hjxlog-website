import React from 'react';
import { Work } from '@/types';
import { API_BASE_URL } from '@/config/api';
import { toast } from 'sonner';

interface WorksTabProps {
  works: Work[];
  filteredWorks: Work[];
  currentWorks: Work[];
  workSearchQuery: string;
  workSelectedCategory: string;
  workSelectedStatus: string;
  workCategories: string[];
  workStatuses: string[];
  workCurrentPage: number;
  totalWorkPages: number;
  handleWorkSearch: (query: string) => void;
  handleWorkCategoryFilter: (category: string) => void;
  handleWorkStatusFilter: (status: string) => void;
  setWorkCurrentPage: (page: number) => void;
  setWorkSearchQuery: (query: string) => void;
  setWorkSelectedCategory: (category: string) => void;
  setWorkSelectedStatus: (status: string) => void;
  openWorkForm: (work?: Work) => void;
  handleDeleteWork: (id: number) => Promise<void>;
  handleToggleWorkFeatured: (id: number, featured: boolean) => Promise<void>;
}

export default function WorksTab({
  works,
  filteredWorks,
  currentWorks,
  workSearchQuery,
  workSelectedCategory,
  workSelectedStatus,
  workCategories,
  workStatuses,
  workCurrentPage,
  totalWorkPages,
  handleWorkSearch,
  handleWorkCategoryFilter,
  handleWorkStatusFilter,
  setWorkCurrentPage,
  setWorkSearchQuery,
  setWorkSelectedCategory,
  setWorkSelectedStatus,
  openWorkForm,
  handleDeleteWork,
  handleToggleWorkFeatured
}: WorksTabProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">作品管理</h2>
        <div className="flex gap-3">
          <button
            onClick={() => openWorkForm()}
            className="px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-[#165DFF]/90 transition-colors"
          >
            <i className="fas fa-plus mr-2"></i>添加作品
          </button>
        </div>
      </div>

      {/* 搜索和筛选区域 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 搜索框 */}
          <div className="md:col-span-2">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索作品标题、描述或标签..."
                value={workSearchQuery}
                onChange={(e) => handleWorkSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <i className="fas fa-search"></i>
              </span>
            </div>
          </div>

          {/* 分类筛选 */}
          <div>
            <select
              value={workSelectedCategory}
              onChange={(e) => handleWorkCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">所有分类</option>
              {workCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* 状态筛选 */}
          <div>
            <select
              value={workSelectedStatus}
              onChange={(e) => handleWorkStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">所有状态</option>
              {workStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            显示 {currentWorks.length} 条，共 {filteredWorks.length} 条作品
            {workSearchQuery && ` (搜索: "${workSearchQuery}")`}
            {workSelectedCategory && ` (分类: ${workSelectedCategory})`}
            {workSelectedStatus && ` (状态: ${workSelectedStatus})`}
          </span>
          {(workSearchQuery || workSelectedCategory || workSelectedStatus) && (
            <button
              onClick={() => {
                setWorkSearchQuery('');
                setWorkSelectedCategory('');
                setWorkSelectedStatus('');
                setWorkCurrentPage(1);
              }}
              className="text-blue-500 hover:text-blue-600"
            >
              清除筛选
            </button>
          )}
        </div>
      </div>

      {/* 作品列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentWorks.length > 0 ? (
          currentWorks.map(work => (
            <div key={work.id} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-slate-800">{work.title}</h3>
                <div className="flex space-x-2">
                   <button
                     onClick={() => handleToggleWorkFeatured(work.id, work.featured || false)}
                     className={`transition-colors p-2 rounded-lg ${
                       work.featured 
                         ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100' 
                         : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-50'
                     }`}
                     title={work.featured ? '取消精选' : '设为精选'}
                   >
                     <i className={`${work.featured ? 'fas' : 'far'} fa-star`}></i>
                   </button>
                   <button
                     onClick={() => openWorkForm(work)}
                     className="text-[#165DFF] hover:bg-blue-50 transition-colors p-2 rounded-lg"
                     title="编辑"
                   >
                     <i className="fas fa-edit"></i>
                   </button>
                   <button
                     onClick={() => handleDeleteWork(work.id)}
                     className="text-red-500 hover:bg-red-50 transition-colors p-2 rounded-lg"
                     title="删除"
                   >
                     <i className="fas fa-trash"></i>
                   </button>
                 </div>
              </div>
              
              <p className="text-slate-600 text-sm mb-3">{work.description}</p>
              
              <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
                 <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded">{work.category}</span>
                 <span className={`px-2 py-1 rounded ${
                   work.status === 'active' ? 'bg-green-100 text-green-600' :
                   work.status === 'completed' ? 'bg-blue-100 text-blue-600' :
                   'bg-gray-100 text-gray-600'
                 }`}>
                   {work.status === 'active' ? '进行中' : 
                    work.status === 'completed' ? '已完成' : 
                    work.status === 'archived' ? '已归档' : 
                    work.status === 'planning' ? '计划中' : work.status}
                 </span>
               </div>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {work.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                    {tag}
                  </span>
                ))}
              </div>
              
              <p className="text-xs text-slate-400">{work.date || work.created_at}</p>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white rounded-xl p-12 shadow-sm text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-briefcase text-4xl text-blue-500"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              {workSearchQuery || workSelectedCategory || workSelectedStatus 
                ? '没有找到匹配的作品' 
                : '还没有作品'}
            </h3>
            <p className="text-gray-600 mb-6">
              {workSearchQuery || workSelectedCategory || workSelectedStatus 
                ? '尝试调整搜索条件或筛选器' 
                : '开始添加你的第一个作品吧！'}
            </p>
            {!(workSearchQuery || workSelectedCategory || workSelectedStatus) && (
              <button
                 onClick={() => openWorkForm()}
                 className="px-6 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-[#165DFF]/90 transition-colors flex items-center justify-center mx-auto"
               >
                 <i className="fas fa-plus mr-2"></i> 添加作品
               </button>
            )}
          </div>
        )}
      </div>

      {/* 分页控制 */}
      {totalWorkPages > 1 && (
        <div className="mt-8 flex items-center justify-center space-x-2">
          <button
            onClick={() => setWorkCurrentPage(Math.max(1, workCurrentPage - 1))}
            disabled={workCurrentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← 上一页
          </button>
          
          <div className="flex space-x-1">
            {Array.from({ length: totalWorkPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setWorkCurrentPage(page)}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  page === workCurrentPage
                    ? 'bg-[#165DFF] text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setWorkCurrentPage(Math.min(totalWorkPages, workCurrentPage + 1))}
            disabled={workCurrentPage === totalWorkPages}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            下一页 →
          </button>
        </div>
      )}
    </div>
  );
}