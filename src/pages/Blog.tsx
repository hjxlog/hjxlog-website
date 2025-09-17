import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  created_at: string;
  updated_at: string;
  category: string;
  tags: string[];
  cover_image: string;
  views: number;
  likes: number;
  published: boolean;
  featured?: boolean;
}

const Blog: React.FC = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>(['全部']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalBlogs, setTotalBlogs] = useState(0);
  
  const blogsPerPage = 6;

  // 获取所有分类
  const fetchCategories = async () => {
    try {

      const response = await fetch(`${API_BASE_URL}/api/blogs/categories`);

      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        const categories = ['全部', ...result.data];
        setAllCategories(categories);

      } else {
        throw new Error(result.message || '获取分类失败');
      }
    } catch (err) {

      // 如果API失败，尝试从当前博客数据中提取分类
      const fallbackCategories = ['全部'];
      setAllCategories(fallbackCategories);
    }
  };

  // 获取博客数据
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      

      
      // 构建查询参数
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: blogsPerPage.toString(),
        published: 'true' // 只获取已发布的博客
      });
      
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      
      if (selectedCategory !== '全部') {
        queryParams.append('category', selectedCategory);
      }
      

      const response = await fetch(`${API_BASE_URL}/api/blogs?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || '获取博客数据失败');
      }


      
      setBlogs(result.data.blogs || []);
      setTotalBlogs(result.data.total || 0);
      
      if (result.data.blogs && result.data.blogs.length > 0) {

      } else {
        console.warn('⚠️ [Blog页面] 未获取到博客数据');
      }
      
    } catch (err) {

      setError('获取博客数据失败，请稍后重试');
      setBlogs([]);
      setTotalBlogs(0);
    } finally {
      setLoading(false);

    }
  };
  
  // 分页计算
  const totalPages = Math.ceil(totalBlogs / blogsPerPage);
  
  // 初始化和数据获取
  useEffect(() => {
    fetchBlogs();
  }, [currentPage, searchQuery, selectedCategory]);

  // 初始化时获取分类数据
  useEffect(() => {
    fetchCategories();
  }, []);
  
  // 重置页码当搜索或分类改变时
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchQuery, selectedCategory]);
  
  // 导航栏滚动效果
  useEffect(() => {
    const handleScroll = () => {
      const nav = document.querySelector('.nav-scrolled');
      if (nav) {
        if (window.scrollY > 50) {
          nav.classList.add('bg-white/90', 'backdrop-blur-md', 'shadow-lg');
        } else {
          nav.classList.remove('bg-white/90', 'backdrop-blur-md', 'shadow-lg');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 使用公共导航组件 */}
      <PublicNav />

      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Blog</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            分享前沿技术见解，探索人文科技交汇
          </p>
        </div>

        {/* 搜索和筛选 */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-col md:flex-row gap-4">
              {/* 搜索框 */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="搜索博客标题、内容或标签..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
              </div>
              
              {/* 分类筛选 */}
              <div className="flex flex-wrap gap-2">
                {allCategories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6">
            <ErrorMessage 
              message={error} 
              onRetry={fetchBlogs}
              onDismiss={() => setError(null)}
            />
          </div>
        )}

        {/* 博客列表 */}
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="py-12">
              <LoadingSpinner size="lg" text="正在加载博客列表..." />
            </div>
          ) : blogs.length > 0 ? (
             <div className="space-y-6 mb-12">
               {blogs.map((blog, index) => (
                <article 
                  key={blog.id}
                  className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-all duration-300 border-l-4 border-blue-500"
                  onClick={() => navigate(`/blog/${blog.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full font-medium">
                        {blog.category}
                      </span>
                      <div className="flex items-center text-sm text-gray-500 gap-2">
                        <span>{new Date(blog.created_at).toLocaleDateString('zh-CN')}</span>
                        <span>·</span>
                        <span>{blog.author}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <span>❤️</span>
                        <span>{blog.likes}</span>
                      </div>
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-bold mb-3 text-gray-800 hover:text-blue-500 transition-colors">
                    {blog.title}
                  </h2>
                  
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {blog.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {blog.tags.map(tag => (
                        <span 
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md hover:bg-gray-200 transition-colors"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center text-blue-500 font-medium">
                      <span className="mr-2">阅读全文</span>
                      <span>→</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <span className="text-2xl text-gray-400">🔍</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">未找到相关博客</h3>
              <p className="text-gray-600">尝试调整搜索关键词或选择其他分类</p>
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>←</span>
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>→</span>
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;