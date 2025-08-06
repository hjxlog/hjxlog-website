import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// 移除对lib/api的依赖，直接调用服务器API
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { apiRequest } from '../config/api';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

interface Blog {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  published: boolean;
  created_at: string;
  updated_at: string;
  views?: number;
  likes?: number;
}

const BlogManagement: React.FC = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showPublishedOnly, setShowPublishedOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBlogs, setTotalBlogs] = useState(0);
  const blogsPerPage = 10;

  // 获取博客列表
  const fetchBlogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: blogsPerPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(showPublishedOnly && { published: 'true' })
      });
      
      const data = await apiRequest(`/api/blogs?${params}`);
      setBlogs(data.blogs || []);
      setTotalBlogs(data.total || 0);
    } catch (error) {
      console.error('获取博客列表失败:', error);
      setError('获取博客列表失败');
      toast.error('API连接失败');
      setBlogs([]);
      setTotalBlogs(0);
    } finally {
      setLoading(false);
    }
  };

  // 删除博客
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这篇博客吗？此操作不可撤销。')) {
      return;
    }

    try {
      await apiRequest(`/api/blogs/${id}`, {
        method: 'DELETE'
      });
      toast.success('博客删除成功');
      fetchBlogs(); // 重新获取列表
    } catch (error) {
      console.error('删除博客失败:', error);
      toast.error('删除博客失败');
    }
  };

  // 切换发布状态
  const togglePublishStatus = async (id: number, currentStatus: boolean) => {
    try {
      const result = await apiRequest(`/api/blogs/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ published: !currentStatus })
      });
      if (result.success) {
        toast.success(`博客已${!currentStatus ? '发布' : '取消发布'}`);
        fetchBlogs(); // 重新获取列表
      } else {
        throw new Error(result.message || '更新失败');
      }
    } catch (error) {
      console.error('更新发布状态失败:', error);
      toast.error('更新发布状态失败');
    }
  };

  // 处理发布状态切换
  const handleTogglePublish = async (id: number, newStatus: boolean) => {
    try {
      const result = await apiRequest(`/api/blogs/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ published: newStatus })
      });
      if (result.success) {
        toast.success(`博客已${newStatus ? '发布' : '取消发布'}`);
        fetchBlogs(); // 重新获取列表
      } else {
        throw new Error(result.message || '更新失败');
      }
    } catch (error) {
      console.error('更新发布状态失败:', error);
      toast.error('更新发布状态失败');
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [currentPage, searchQuery, selectedCategory, showPublishedOnly]);

  const totalPages = Math.ceil(totalBlogs / blogsPerPage);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">博客管理</h1>
              <p className="mt-1 text-sm text-gray-500">
                管理您的博客文章，创建、编辑和发布内容
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/blog/create')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              新建博客
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜索和筛选 */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="搜索博客..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">所有分类</option>
              <option value="Technology">技术</option>
              <option value="React">React</option>
              <option value="JavaScript">JavaScript</option>
              <option value="CSS">CSS</option>
            </select>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="publishedOnly"
                checked={showPublishedOnly}
                onChange={(e) => setShowPublishedOnly(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <label htmlFor="publishedOnly" className="ml-2 text-sm text-gray-700">
                仅显示已发布
              </label>
            </div>
            <div className="text-sm text-gray-500 flex items-center">
              <FunnelIcon className="h-4 w-4 mr-1" />
              共 {totalBlogs} 篇博客
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6">
            <ErrorMessage 
              message={error} 
              onRetry={fetchBlogs}
              onDismiss={() => setError(null)}
            />
          </div>
        )}

        {/* 博客列表 */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {loading ? (
            <LoadingSpinner size="lg" text="正在加载博客列表..." />
          ) : blogs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">没有找到博客文章</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {blogs.map((blog) => (
                <li key={blog.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {blog.title}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            blog.published
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {blog.published ? '已发布' : '草稿'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {blog.excerpt}
                      </p>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span>分类: {blog.category}</span>
                        <span>创建: {formatDate(blog.created_at)}</span>
                        {blog.views !== undefined && <span>浏览: {blog.views}</span>}
                        {blog.likes !== undefined && <span>点赞: {blog.likes}</span>}
                      </div>
                      {blog.tags && blog.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {blog.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => navigate(`/blog/${blog.id}`)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="查看"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/blog/edit/${blog.id}`)}
                        className="p-2 text-indigo-400 hover:text-indigo-600"
                        title="编辑"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleTogglePublish(blog.id, !blog.published)}
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          blog.published
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                        title={blog.published ? '取消发布' : '发布'}
                      >
                        {blog.published ? '取消发布' : '发布'}
                      </button>
                      <button
                        onClick={() => handleDelete(blog.id)}
                        className="p-2 text-red-400 hover:text-red-600"
                        title="删除"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  显示第 <span className="font-medium">{(currentPage - 1) * blogsPerPage + 1}</span> 到{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * blogsPerPage, totalBlogs)}
                  </span>{' '}
                  条，共 <span className="font-medium">{totalBlogs}</span> 条结果
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogManagement;