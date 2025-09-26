import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const fetchCategories = async () => {
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
  };

  // 获取作品列表
  const fetchWorks = async (category?: string) => {
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
  };

  // 初始化数据
  useEffect(() => {
    fetchCategories();
    fetchWorks();
  }, []);

  // 分类切换
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    fetchWorks(category);
  };

  // 根据分类筛选作品
  const filteredWorks = selectedCategory === "全部" 
    ? works 
    : works.filter(work => work.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#165DFF] mx-auto mb-4"></div>
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">加载失败</h3>
          <p className="text-slate-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-[#165DFF]/90 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 使用公共导航组件 */}
      <PublicNav />

      <main className="container mx-auto px-4 py-24">
        {/* 页面标题 */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
            我的作品
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            展示我在不同领域的项目作品，包括Web开发、移动应用、UI设计等
          </p>
        </div>

        {/* 分类筛选 */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {["全部", ...categories.filter(cat => cat !== "全部")].map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-6 py-3 rounded-full transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-[#165DFF] text-white shadow-lg'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* 作品网格 */}
        {filteredWorks.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl text-slate-300 mb-4">
              <i className="fas fa-folder-open"></i>
            </div>
            <h3 className="text-xl font-semibold text-slate-600 mb-2">暂无作品</h3>
            <p className="text-slate-500">该分类下还没有作品</p>
            <button 
              className="mt-4 px-4 py-2 text-[#165DFF] hover:bg-[#165DFF]/10 rounded-lg transition-colors"
              onClick={() => setSelectedCategory("全部")}
            >
              查看全部作品
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredWorks.map((work) => (
              <div
                key={work.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={work.cover_image}
                    alt={work.title}
                    loading="lazy"
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex space-x-2">
                      <button 
                        className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-slate-600 hover:bg-white transition-colors"
                        onClick={() => navigate(`/works/${work.id}`)}
                      >
                        <i className="fas fa-eye text-sm"></i>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-[#165DFF]/10 text-[#165DFF] text-sm rounded-full">
                      {work.category}
                    </span>
                    <span className="text-sm text-slate-500">{new Date(work.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-slate-800 mb-3 group-hover:text-[#165DFF] transition-colors">
                    {work.title}
                  </h3>
                  
                  <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                    {work.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {work.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-3">
                      {work.project_url && (
                        <a
                          href={work.project_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#165DFF] hover:text-[#165DFF]/80 transition-colors"
                        >
                          <i className="fas fa-external-link-alt"></i>
                        </a>
                      )}
                      {work.github_url && (
                        <a
                          href={work.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-600 hover:text-slate-800 transition-colors"
                        >
                          <i className="fab fa-github"></i>
                        </a>
                      )}
                    </div>
                    
                    <button 
                      className="text-[#165DFF] hover:text-[#165DFF]/80 transition-colors text-sm font-medium"
                      onClick={() => navigate(`/works/${work.id}`)}
                    >
                      查看详情 →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 统计信息 */}
        <div className="mt-16 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-[#165DFF] mb-2">{works.length}</div>
              <div className="text-slate-600">总作品数</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-[#165DFF] mb-2">{categories.length - 1}</div>
              <div className="text-slate-600">技术领域</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-[#165DFF] mb-2">
                {works.filter(work => work.github_url).length}
              </div>
              <div className="text-slate-600">开源项目</div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}