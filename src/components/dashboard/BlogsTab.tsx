import React from 'react';

interface Blog {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  published: boolean;
  tags: string[];
  views?: number;
  likes?: number;
  created_at?: string;
}

interface BlogsTabProps {
  blogs: Blog[];
  filteredBlogs: Blog[];
  currentBlogs: Blog[];
  blogSearchQuery: string;
  blogSelectedCategory: string;
  blogSelectedStatus: string;
  blogCategories: string[];
  blogStatuses: string[];
  blogCurrentPage: number;
  totalBlogPages: number;
  handleBlogSearch: (query: string) => void;
  handleBlogCategoryFilter: (category: string) => void;
  handleBlogStatusFilter: (status: string) => void;
  setBlogCurrentPage: (page: number) => void;
  setBlogSearchQuery: (query: string) => void;
  setBlogSelectedCategory: (category: string) => void;
  setBlogSelectedStatus: (status: string) => void;
  openBlogForm: (blog?: Blog) => void;
  handleDeleteBlog: (id: number) => Promise<void>;
  renderBlogStatusBadge: (published: boolean) => JSX.Element;
}

export default function BlogsTab({
  blogs,
  filteredBlogs,
  currentBlogs,
  blogSearchQuery,
  blogSelectedCategory,
  blogSelectedStatus,
  blogCategories,
  blogStatuses,
  blogCurrentPage,
  totalBlogPages,
  handleBlogSearch,
  handleBlogCategoryFilter,
  handleBlogStatusFilter,
  setBlogCurrentPage,
  setBlogSearchQuery,
  setBlogSelectedCategory,
  setBlogSelectedStatus,
  openBlogForm,
  handleDeleteBlog,
  renderBlogStatusBadge
}: BlogsTabProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">博客管理</h2>
        <button
          onClick={() => openBlogForm()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          ➕ 写博客
        </button>
      </div>

      {/* 搜索和筛选区域 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 搜索框 */}
          <div className="md:col-span-2">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索博客标题、内容或标签..."
                value={blogSearchQuery}
                onChange={(e) => handleBlogSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </span>
            </div>
          </div>

          {/* 分类筛选 */}
          <div>
            <select
              value={blogSelectedCategory}
              onChange={(e) => handleBlogCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">所有分类</option>
              {blogCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* 状态筛选 */}
          <div>
            <select
              value={blogSelectedStatus}
              onChange={(e) => handleBlogStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">所有状态</option>
              {blogStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            显示 {currentBlogs.length} 条，共 {filteredBlogs.length} 条博客
            {blogSearchQuery && ` (搜索: "${blogSearchQuery}")`}
            {blogSelectedCategory && ` (分类: ${blogSelectedCategory})`}
            {blogSelectedStatus && ` (状态: ${blogSelectedStatus})`}
          </span>
          {(blogSearchQuery || blogSelectedCategory || blogSelectedStatus) && (
            <button
              onClick={() => {
                setBlogSearchQuery('');
                setBlogSelectedCategory('');
                setBlogSelectedStatus('');
                setBlogCurrentPage(1);
              }}
              className="text-blue-500 hover:text-blue-600"
            >
              清除筛选
            </button>
          )}
        </div>
      </div>

      {/* 博客列表 */}
      <div className="space-y-4">
        {currentBlogs.length > 0 ? (
          currentBlogs.map(blog => (
          <div key={blog.id} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-slate-800">{blog.title}</h3>
                  {renderBlogStatusBadge(blog.published)}
                </div>
                
                <p className="text-slate-600 text-sm mb-3">{blog.excerpt}</p>
                
                <div className="flex items-center space-x-4 text-sm text-slate-500">
                  <span>{blog.category}</span>
                  <span>👁 {blog.views || 0}</span>
                  <span>❤️ {blog.likes || 0}</span>
                  {blog.created_at && <span>{new Date(blog.created_at).toLocaleDateString()}</span>}
                </div>
                
                <div className="flex flex-wrap gap-1 mt-3">
                  {blog.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => openBlogForm(blog)}
                  className="text-gray-400 hover:text-blue-500 transition-colors p-2"
                  title="编辑"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDeleteBlog(blog.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-2"
                  title="删除"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))
        ) : (
          <div className="bg-white rounded-xl p-12 shadow-sm text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              {blogSearchQuery || blogSelectedCategory || blogSelectedStatus 
                ? '没有找到匹配的博客' 
                : '还没有博客'}
            </h3>
            <p className="text-gray-600 mb-6">
              {blogSearchQuery || blogSelectedCategory || blogSelectedStatus 
                ? '尝试调整搜索条件或筛选器' 
                : '开始写你的第一篇博客吧！'}
            </p>
            {!(blogSearchQuery || blogSelectedCategory || blogSelectedStatus) && (
              <button
                onClick={() => openBlogForm()}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                ➕ 写博客
              </button>
            )}
          </div>
        )}
      </div>

      {/* 分页控制 */}
      {totalBlogPages > 1 && (
        <div className="mt-8 flex items-center justify-center space-x-2">
          <button
            onClick={() => setBlogCurrentPage(Math.max(1, blogCurrentPage - 1))}
            disabled={blogCurrentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← 上一页
          </button>
          
          <div className="flex space-x-1">
            {Array.from({ length: totalBlogPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setBlogCurrentPage(page)}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  page === blogCurrentPage
                    ? 'bg-blue-500 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setBlogCurrentPage(Math.min(totalBlogPages, blogCurrentPage + 1))}
            disabled={blogCurrentPage === totalBlogPages}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            下一页 →
          </button>
        </div>
      )}
    </div>
  );
}