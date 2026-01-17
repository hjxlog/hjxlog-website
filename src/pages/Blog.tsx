import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, ChevronLeft, ChevronRight, Calendar, Tag, Heart } from 'lucide-react';
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
  
  // 随机渐变生成器
  const getGradient = (id: number) => {
    const gradients = [
      'from-blue-50 to-indigo-50',
      'from-rose-50 to-orange-50',
      'from-emerald-50 to-teal-50',
      'from-violet-50 to-purple-50',
      'from-amber-50 to-yellow-50',
      'from-cyan-50 to-blue-50',
    ];
    return gradients[id % gradients.length];
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] relative flex flex-col">
      {/* 顶部白色渐变背景，确保导航栏区域视觉与首页一致 */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-white via-white/50 to-[#f5f5f7] z-0 pointer-events-none" />

      <PublicNav />

      <main className="container mx-auto px-6 pt-24 pb-24 max-w-6xl relative z-10 flex-1 w-full">
        {/* Header & Search Toolbar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-1"
          >
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">我的博客</h1>
            <p className="text-slate-500 text-sm font-medium">分享前沿技术见解，探索人文科技交汇</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3"
          >
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="搜索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
            
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm appearance-none cursor-pointer hover:bg-slate-50 hover:border-slate-300 outline-none"
              >
                {allCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            </div>
          </motion.div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-3xl mx-auto mb-8">
            <ErrorMessage 
              message={error} 
              onRetry={fetchBlogs}
              onDismiss={() => setError(null)}
            />
          </div>
        )}

        {/* Blog Grid */}
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner size="lg" text="正在加载内容..." />
            </div>
          ) : blogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {blogs.map((blog, index) => (
                <motion.article 
                  key={blog.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative bg-white rounded-[2rem] overflow-hidden border border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer h-full flex flex-col"
                  onClick={() => navigate(`/blog/${blog.id}`)}
                >
                  {/* Cover Image Area */}
                  <div className="aspect-[16/10] bg-slate-100 relative overflow-hidden">
                    {blog.cover_image ? (
                      <img src={blog.cover_image} alt={blog.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${getGradient(blog.id)}`} />
                    )}
                    
                    {/* Category Badge overlay */}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md text-[10px] font-bold text-slate-900 rounded-full shadow-sm tracking-wide uppercase">
                        {blog.category}
                      </span>
                    </div>
                  </div>

                  {/* Content Body */}
                  <div className="p-6 flex flex-col flex-1">
                    {/* Date & Meta */}
                    <div className="flex items-center gap-3 text-xs font-medium text-slate-400 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <time>{new Date(blog.created_at).toLocaleDateString('zh-CN')}</time>
                      </div>
                      <span>·</span>
                      <div className="flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5" />
                        <span>{blog.likes}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-slate-900 mb-3 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                      {blog.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-6 flex-1">
                      {blog.excerpt}
                    </p>

                    {/* Tags (Minimalist) */}
                    <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-50">
                      {blog.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] font-semibold text-slate-500 bg-slate-100/80 px-2 py-1 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">未找到相关内容</h3>
              <p className="text-slate-500">尝试更换关键词或筛选条件</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 rounded-full font-medium transition-all ${
                      currentPage === page
                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-5 h-5" />
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