import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';
import { apiRequest } from '@/config/api';

// 主页面组件
export default function Home() {
  const navigate = useNavigate();
  
  // 状态管理
  const [featuredData, setFeaturedData] = useState<{
    works: any[];
    blogs: any[];
  }>({
    works: [],
    blogs: []
  });
  const [loading, setLoading] = useState(true);
  const [screenSize, setScreenSize] = useState({ width: 1024, height: 768 });
  const [error, setError] = useState<string | null>(null);
  
  // 获取推荐内容
  const fetchFeaturedContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiRequest('/api/featured');
      
      if (result.success) {
        setFeaturedData(result.data);
      } else {
        throw new Error(result.message || '获取推荐内容失败');
      }
    } catch (err: any) {
      console.error('获取推荐内容失败:', err);
      setError(err.message);
      // 如果API失败，使用空数组作为默认值
      setFeaturedData({ works: [], blogs: [] });
    } finally {
      setLoading(false);
    }
  };
  
  // 监听屏幕尺寸变化
  useEffect(() => {
    const updateScreenSize = () => {
      setScreenSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    // 初始化屏幕尺寸
    updateScreenSize();
    
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  // 组件挂载时获取数据
  useEffect(() => {
    // 添加小延迟确保组件完全挂载
    const timer = setTimeout(() => {
      fetchFeaturedContent();
    }, 100);

    return () => clearTimeout(timer);
  }, []);
  
  // 滚动动画效果
  useEffect(() => {
    const checkScroll = () => {
      const fadeElements = document.querySelectorAll('.fade-in');
      fadeElements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (elementTop < windowHeight - 100) {
          element.classList.add('visible');
        }
      });
    };
    
    // 立即检查一次，确保首屏内容显示
    const timer = setTimeout(checkScroll, 100);
    
    window.addEventListener('scroll', checkScroll);
    window.addEventListener('load', checkScroll);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', checkScroll);
    };
  }, [featuredData]); // 依赖featuredData，确保数据更新后重新检查
  
  // 导航栏滚动效果
  useEffect(() => {
    const nav = document.getElementById('mainNav');
    if (!nav) return;
    
    const handleScroll = () => {
      if (window.scrollY > 50) {
        nav.classList.add('nav-scrolled');
      } else {
        nav.classList.remove('nav-scrolled');
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // 返回顶部按钮
  useEffect(() => {
    const backToTop = document.getElementById('backToTop');
    if (!backToTop) return;
    
    const handleScroll = () => {
      if (window.scrollY > 300) {
        backToTop.classList.remove('opacity-0', 'invisible');
        backToTop.classList.add('opacity-100', 'visible');
      } else {
        backToTop.classList.remove('opacity-100', 'visible');
        backToTop.classList.add('opacity-0', 'invisible');
      }
    };
    
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    backToTop.addEventListener('click', scrollToTop);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      backToTop.removeEventListener('click', scrollToTop);
    };
  }, []);
  
  return (
    <div className="relative min-h-screen bg-slate-50">
      {/* 使用公共导航组件 */}
      <PublicNav />
      
      {/* 主要内容 */}
      <main className="pt-12 pb-16">
        {/* 英雄区域 */}
        <section className="min-h-[80vh] lg:min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50">
          <div className="container mx-auto px-6 relative z-10 h-full flex items-center">
            <div className="max-w-7xl mx-auto w-full">
              {/* 英雄区域 - 分屏式设计 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch min-h-[calc(80vh-3rem)] lg:min-h-[calc(100vh-3rem)]">
                {/* 左侧：个人简介与核心理念 */}
                <div className="flex flex-col justify-center px-6 sm:px-8 lg:px-12 py-8 sm:py-10 lg:py-12 bg-transparent relative overflow-hidden min-h-[60vh] lg:min-h-0">
                  <div className="max-w-xl mx-auto lg:mx-0 relative z-10">
                    <div className="text-left fade-in">
                      {/* 问候语 */}
                      <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#165DFF]/10 to-[#36CFC9]/10 rounded-full mb-6">
                        <span className="text-2xl mr-2">👋</span>
                        <span className="text-[#165DFF] font-medium">嗨，我是Jianxian！</span>
                      </div>
                      
                      {/* 主标题 */}
                      <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-slate-800 leading-tight">
                        <span className="bg-gradient-to-r from-[#165DFF] to-[#36CFC9] bg-clip-text text-transparent">
                          全栈开发者
                        </span>
                        <br />
                        <span className="text-slate-700">& AI探索者</span>
                      </h1>
                      
                      {/* 个人简介 */}
                      <div className="text-lg text-slate-600 mb-4 leading-relaxed">
                        <p className="mb-3">
                          我是一名充满热情的全栈开发者，专注于用技术解决实际问题。
                          从Java后端开发到AI智能体技术，始终保持对新技术的好奇心。
                        </p>
                        <p className="mb-3">
                            6年开发经验，涉及智能制造、金融科技、HR等多个领域，
                            深刻理解技术如何赋能业务，让复杂系统变得简单易用。
                        </p>
                      </div>

                      {/* 核心理念 */}
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-slate-800 mb-3">💡 我的理念</h3>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-slate-600">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                            <span>技术应该服务于人的，而不是让人适应技术</span>
                          </div>
                          <div className="flex items-center text-sm text-slate-600">
                            <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></span>
                            <span>简单的解决方案往往是最优雅的</span>
                          </div>
                          <div className="flex items-center text-sm text-slate-600">
                            <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                            <span>持续学习是保持竞争力的唯一方式</span>
                          </div>
                        </div>
                      </div>

                      {/* 行动按钮组 */}
                      <div className="flex flex-row gap-4 mb-6">
                        <button 
                          className="group px-8 py-4 bg-gradient-to-r from-[#165DFF] to-[#36CFC9] text-white font-semibold rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center"
                          onClick={() => navigate('/works')}
                        >
                          查看我的作品
                          <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </button>
                        <button 
                          className="group px-8 py-4 border-2 border-[#165DFF] text-[#165DFF] font-semibold rounded-xl hover:bg-[#165DFF] hover:text-white transition-all duration-300 flex items-center"
                          onClick={() => navigate('/blogs')}
                        >
                          查看博客
                          <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </button>
                      </div>

                      {/* 个人兴趣爱好 */}
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-800 mb-3">🎯 兴趣爱好</h3>
                        <div className="flex flex-wrap gap-2">
                          <div className="inline-flex items-center px-3 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-slate-200/50">
                            <span className="text-lg mr-2">🤖</span>
                            <span className="text-sm font-medium text-slate-700">AI研究</span>
                          </div>
                          <div className="inline-flex items-center px-3 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-slate-200/50">
                            <span className="text-lg mr-2">💻</span>
                            <span className="text-sm font-medium text-slate-700">编程开发</span>
                          </div>
                          <div className="inline-flex items-center px-3 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-slate-200/50">
                            <span className="text-lg mr-2">🏔️</span>
                            <span className="text-sm font-medium text-slate-700">户外旅行</span>
                          </div>
                          <div className="inline-flex items-center px-3 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-slate-200/50">
                            <span className="text-lg mr-2">📸</span>
                            <span className="text-sm font-medium text-slate-700">摄影</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 右侧：专业技能与项目展示 */}
                <div className="relative min-h-[60vh] lg:h-full flex items-center justify-center fade-in py-6 lg:py-8" 
                     style={{
                       animationDelay: '0.3s',
                       background: 'transparent',
                       zIndex: 1
                     }}>
                  
                  {/* 背景装饰图案 */}
                  <div className="absolute inset-0 opacity-20">
                    {/* 几何网格背景 */}
                    <div className="absolute inset-0" 
                         style={{
                           backgroundImage: `
                             radial-gradient(circle at 25% 25%, rgba(22, 93, 255, 0.03) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, rgba(54, 207, 201, 0.03) 0%, transparent 50%),
                             linear-gradient(45deg, transparent 48%, rgba(148, 163, 184, 0.02) 49%, rgba(148, 163, 184, 0.02) 51%, transparent 52%)
                           `,
                           backgroundSize: '200px 200px, 300px 300px, 40px 40px'
                         }}></div>
                    
                    {/* 浮动几何形状 */}
                    <div className="absolute top-1/4 left-1/4 w-8 h-8 border border-blue-200/20 rounded-lg transform rotate-12 animate-pulse"></div>
                    <div className="absolute top-3/4 right-1/4 w-6 h-6 bg-gradient-to-br from-cyan-100/30 to-blue-100/30 rounded-full animate-bounce" style={{animationDuration: '3s'}}></div>
                    <div className="absolute top-1/2 right-1/3 w-4 h-4 border border-cyan-200/30 rounded-full animate-spin" style={{animationDuration: '8s'}}></div>
                  </div>

                  {/* 个人信息展示容器 */}
                  <div className="group relative z-10 w-full max-w-md mx-auto px-6 py-2">
                    
                    {/* 头像区域 - 缩小并居中 */}
                    <div className="flex justify-center mb-4">
                      <div className="relative">
                        {/* 简化的装饰效果 */}
                        <div className="absolute inset-0 w-24 h-24 sm:w-28 sm:h-28 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
                          {/* 简化的装饰环 */}
                          <div className="absolute inset-0 w-full h-full rounded-full border border-blue-200/20 animate-pulse" style={{animationDuration: '3s'}}></div>
                          <div className="absolute inset-2 w-auto h-auto rounded-full border border-cyan-200/15 animate-pulse" style={{animationDuration: '4s', animationDelay: '1s'}}></div>
                        </div>
                   
                        {/* 主头像 - 中国人形象，缩小尺寸 */}
                        <div className="relative w-24 h-24 sm:w-28 sm:h-28 z-20">
                          <div className="relative w-full h-full">
                            {/* 简化的头像光晕效果 */}
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/15 to-cyan-400/15 blur-lg group-hover:blur-xl transition-all duration-500"></div>
                            
                            <img 
                              src="https://file.hjxlog.com/blog/images/avatar.jpg"
                              alt="开发者头像"
                              className="relative w-full h-full rounded-full object-cover transition-all duration-500 group-hover:scale-105 shadow-lg"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 个人简介 */}
                    <div className="text-center mb-4">
                      <h2 className="text-xl font-bold text-slate-800 mb-2">Huang JX</h2>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        全栈开发工程师，专注于现代Web技术栈和AI应用开发。
                        热爱探索新技术，致力于用代码创造价值。
                      </p>
                    </div>

                    {/* 核心技术栈 */}
                    <div className="mb-4">
                      <h4 className="text-base font-semibold text-slate-700 mb-3 text-center">核心技术栈</h4>
                      <div className="space-y-3">
                        {/* Java后端 */}
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg px-3 py-3 border border-slate-200/50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <span className="text-lg mr-2">☕</span>
                              <span className="text-base font-semibold text-slate-700">Java后端</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-16 h-1.5 bg-slate-200 rounded-full mr-2">
                                <div className="w-5/6 h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"></div>
                              </div>
                              <span className="text-xs text-slate-500">6年+</span>
                            </div>
                          </div>
                          <p className="text-sm text-slate-500 ml-7">Spring Boot · MyBatis · Redis · MySQL</p>
                        </div>
                        
                        {/* AI智能体 */}
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg px-3 py-3 border border-slate-200/50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <span className="text-lg mr-2">🤖</span>
                              <span className="text-base font-semibold text-slate-700">AI智能体</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-16 h-1.5 bg-slate-200 rounded-full mr-2">
                                <div className="w-2/6 h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"></div>
                              </div>
                              <span className="text-xs text-slate-500">2年+</span>
                            </div>
                          </div>
                          <p className="text-sm text-slate-500 ml-7">LangChain · OpenAI API · RAG · Vector DB</p>
                        </div>
                        
                        {/* 前端开发 */}
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg px-3 py-3 border border-slate-200/50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <span className="text-lg mr-2">⚛️</span>
                              <span className="text-base font-semibold text-slate-700">前端开发</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-16 h-1.5 bg-slate-200 rounded-full mr-2">
                                <div className="w-3/6 h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full"></div>
                              </div>
                              <span className="text-xs text-slate-500">3年+</span>
                            </div>
                          </div>
                          <p className="text-sm text-slate-500 ml-7">React · TypeScript · Tailwind CSS · Next.js</p>
                        </div>
                      </div>
                    </div>

                    {/* 项目统计 */}
                    <div className="mb-4">
                      <h4 className="text-base font-semibold text-slate-700 mb-3 text-center">项目成就</h4>
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-slate-200/50">
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div>
                            <div className="text-lg font-bold text-blue-600">20+</div>
                            <div className="text-xs text-slate-600">项目</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-cyan-600">50K+</div>
                            <div className="text-xs text-slate-600">代码</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-purple-600">15+</div>
                            <div className="text-xs text-slate-600">技术</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-green-600">99%</div>
                            <div className="text-xs text-slate-600">成功率</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* 精选作品 */}
        <section id="work" className="py-16 px-6 bg-slate-50">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center text-slate-800">精选作品</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {loading ? (
                // 加载状态
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="glass-card overflow-hidden animate-pulse">
                    <div className="w-full h-48 bg-slate-200"></div>
                    <div className="p-6">
                      <div className="h-6 bg-slate-200 rounded mb-2"></div>
                      <div className="h-4 bg-slate-200 rounded mb-4"></div>
                      <div className="h-6 bg-slate-200 rounded w-20"></div>
                    </div>
                  </div>
                ))
              ) : featuredData.works.length > 0 ? (
                featuredData.works.map((work, index) => (
                  <div 
                    key={work.id} 
                    className="glass-card overflow-hidden fade-in cursor-pointer" 
                    style={{ animationDelay: `${index * 0.2}s` }}
                    onClick={() => navigate(`/works/${work.id}`)}
                  >
                    {work.cover_image && (
                      <img src={work.cover_image} alt={work.title} className="w-full h-48 object-cover" />
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2 text-slate-800">{work.title}</h3>
                      <p className="text-slate-600 mb-4">{work.description}</p>
                      <span className="inline-block px-3 py-1 bg-[#165DFF]/10 text-[#165DFF] rounded-full text-sm">{work.category}</span>
                    </div>
                  </div>
                ))
              ) : (
                // 无数据状态
                <div className="col-span-3 text-center py-12">
                  <p className="text-slate-500">暂无推荐作品</p>
                </div>
              )}
            </div>
            
            <div className="text-center mt-12">
              <button 
                className="inline-block px-6 py-2 outline-btn rounded-full font-medium"
                onClick={() => navigate('/works')}
              >
                查看全部作品
              </button>
            </div>
          </div>
        </section>
        
        {/* 博客页 */}
        <section id="blog" className="py-16 px-6 bg-slate-50">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center text-slate-800">推荐博客</h2>
            
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
              {loading ? (
                // 加载状态
                Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="glass-card overflow-hidden animate-pulse">
                    <div className="w-full h-48 bg-slate-200"></div>
                    <div className="p-6">
                      <div className="h-4 bg-slate-200 rounded mb-3 w-32"></div>
                      <div className="h-6 bg-slate-200 rounded mb-3"></div>
                      <div className="h-4 bg-slate-200 rounded mb-4"></div>
                      <div className="flex justify-between">
                        <div className="h-4 bg-slate-200 rounded w-20"></div>
                        <div className="h-4 bg-slate-200 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : featuredData.blogs.length > 0 ? (
                featuredData.blogs.map((blog, index) => (
                  <div 
                    key={blog.id} 
                    className="glass-card overflow-hidden fade-in cursor-pointer" 
                    style={{ animationDelay: `${index * 0.2}s` }}
                    onClick={() => navigate(`/blog/${blog.id}`)}
                  >
                    {blog.cover_image && (
                      <img src={blog.cover_image} alt={blog.title} className="w-full h-48 object-cover" />
                    )}
                    <div className="p-6">
                      <div className="flex items-center text-sm text-slate-500 mb-3">
                        <span>{new Date(blog.created_at).toLocaleDateString('zh-CN')}</span>
                        <span className="mx-2">·</span>
                        <span>{blog.author}</span>
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-slate-800">{blog.title}</h3>
                      <p className="text-slate-600 mb-4">{blog.excerpt}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[#165DFF] font-medium hover:underline">阅读更多</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // 无数据状态
                <div className="col-span-2 text-center py-12">
                  <p className="text-slate-500">暂无推荐博客</p>
                </div>
              )}
            </div>
            
            <div className="text-center mt-12">
              <button 
                className="inline-block px-6 py-2 outline-btn rounded-full font-medium"
                onClick={() => navigate('/blogs')}
              >
                查看全部博客
              </button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
      
      {/* 返回顶部按钮 */}
      <button id="backToTop" className="fixed bottom-8 right-8 w-12 h-12 rounded-full bg-[#165DFF] text-white shadow-lg flex items-center justify-center opacity-0 invisible transition-all">
        <i className="fas fa-arrow-up"></i>
      </button>
    </div>
  );
}