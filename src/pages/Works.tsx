import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Github, ExternalLink, FolderOpen, ArrowRight, Layers } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';
import { apiRequest } from '../config/api';

interface Work {
  id: number;
  title: string;
  description: string;
  cover_image: string;
  category: string;
  tags: string[];
  project_url?: string;
  github_url?: string;
  created_at: string;
  status: string;
}

export default function Works() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [works, setWorks] = useState<Work[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取作品分类列表
  const fetchCategories = useCallback(async () => {
    try {
      const result = await apiRequest('/api/works/categories');
      
      if (result.success) {
        setCategories(result.data);
      } else {
        throw new Error(result.message || '获取分类失败');
      }
    } catch (error) {
      console.error('获取作品分类失败:', error);
      setError('获取分类失败');
    }
  }, []);

  // 获取作品列表
  const fetchWorks = useCallback(async (category?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      let endpoint = '/api/works?limit=50';
      if (category && category !== '全部') {
        endpoint += `&category=${encodeURIComponent(category)}`;
      }
      
      const result = await apiRequest(endpoint);
      
      if (result.success) {
        setWorks(result.data.works);
      } else {
        throw new Error(result.message || '获取作品失败');
      }
    } catch (error) {
      console.error('获取作品列表失败:', error);
      setError('获取作品失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化数据
  useEffect(() => {
    fetchCategories();
    fetchWorks();
  }, [fetchCategories, fetchWorks]);

  // 分类切换
  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    fetchWorks(category);
  }, [fetchWorks]);

  // 根据分类筛选作品
  const filteredWorks = useMemo(() => (
    selectedCategory === "全部"
      ? works
      : works.filter(work => work.category === selectedCategory)
  ), [selectedCategory, works]);

  const categoryOptions = useMemo(
    () => ["全部", ...categories.filter(cat => cat !== "全部")],
    [categories]
  );

  return (
    <div className="min-h-screen bg-[#f5f5f7] relative flex flex-col">
      {/* 顶部白色渐变背景 */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-white via-white/50 to-[#f5f5f7] z-0 pointer-events-none" />

      <PublicNav />

      <main className="container mx-auto px-6 pt-24 pb-24 max-w-6xl relative z-10 flex-1 w-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">精选作品</h1>
            <p className="text-slate-500 font-medium max-w-md">
              探索代码与设计的融合，展示我在 Web 开发、移动应用及 UI 设计领域的实践。
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-2"
          >
            {categoryOptions.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60 hover:border-slate-300'
                }`}
              >
                {category}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Works Grid */}
        {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
             {[...Array(4)].map((_, i) => (
               <div key={i} className="bg-white rounded-[2rem] overflow-hidden border border-slate-200/60 shadow-sm h-[500px] animate-pulse">
                 <div className="aspect-[16/10] bg-slate-200" />
                 <div className="p-8 space-y-4">
                   <div className="h-8 bg-slate-200 rounded w-3/4" />
                   <div className="space-y-2">
                     <div className="h-4 bg-slate-200 rounded w-full" />
                     <div className="h-4 bg-slate-200 rounded w-5/6" />
                   </div>
                   <div className="pt-6 border-t border-slate-100 flex justify-between mt-auto">
                     <div className="flex gap-2">
                       <div className="h-6 w-16 bg-slate-200 rounded" />
                       <div className="h-6 w-16 bg-slate-200 rounded" />
                     </div>
                   </div>
                 </div>
               </div>
             ))}
           </div>
        ) : error ? (
          <div className="text-center py-32">
            <div className="text-red-500 mb-4">
              <Layers className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">加载失败</h3>
            <p className="text-slate-500 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors font-medium"
            >
              重新加载
            </button>
          </div>
        ) : filteredWorks.length === 0 ? (
          <div className="text-center py-32 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-200">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
              <FolderOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">暂无相关作品</h3>
            <p className="text-slate-500 mb-6">该分类下暂无项目展示</p>
            <button 
              className="text-[#165DFF] font-medium hover:underline underline-offset-4"
              onClick={() => setSelectedCategory("全部")}
            >
              查看全部作品
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {filteredWorks.map((work, index) => (
              <motion.article
                key={work.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group flex flex-col bg-white rounded-[2rem] overflow-hidden border border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer h-full"
                onClick={() => navigate(`/works/${work.id}`)}
              >
                {/* Cover Image */}
                <div className="aspect-[16/10] overflow-hidden bg-slate-100 relative">
                  <img
                    src={work.cover_image}
                    alt={work.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Category Badge */}
                  <div className="absolute top-5 left-5">
                    <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md text-[10px] font-bold text-slate-900 rounded-full shadow-sm tracking-wide uppercase">
                      {work.category}
                    </span>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-slate-900 leading-tight group-hover:text-[#165DFF] transition-colors">
                      {work.title}
                    </h2>
                    <div className="flex gap-3 pt-1">
                      {work.github_url && (
                        <a 
                          href={work.github_url}
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-400 hover:text-slate-900 transition-colors"
                          title="View Source"
                        >
                          <Github className="w-5 h-5" />
                        </a>
                      )}
                      {work.project_url && (
                        <a 
                          href={work.project_url}
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-400 hover:text-[#165DFF] transition-colors"
                          title="Visit Project"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-slate-500 text-base leading-relaxed line-clamp-2 mb-6 flex-1">
                    {work.description}
                  </p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-auto">
                    <div className="flex flex-wrap gap-2">
                      {work.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-[#165DFF] text-sm font-semibold flex items-center gap-1 group/btn opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
                      详情 <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
