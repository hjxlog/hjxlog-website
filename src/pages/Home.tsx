import { useEffect, useState, useContext, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';
import { apiRequest } from '@/config/api';

// 懒加载ECharts组件
const ReactECharts = lazy(() => import('echarts-for-react'));

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
  const [error, setError] = useState<string | null>(null);
  
  // 联系表单状态
  const [contactForm, setContactForm] = useState<{
    name: string;
    email: string;
    subject: string;
    message: string;
  }>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
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
  
  // 处理联系表单输入变化
  const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 提交联系表单
  const handleContactFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      setSubmitMessage('请填写所有必填字段');
      setSubmitSuccess(false);
      return;
    }
    
    setIsSubmitting(true);
    setSubmitMessage('');
    
    try {
      const result = await apiRequest('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          name: contactForm.name,
          email: contactForm.email,
          subject: contactForm.subject || '来自网站的消息',
          message: contactForm.message
        }),
      });
      
      if (result.success) {
        setSubmitMessage('消息发送成功！我会尽快回复您。');
        setSubmitSuccess(true);
        setContactForm({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      } else {
        setSubmitMessage(result.message || '发送失败，请稍后重试');
        setSubmitSuccess(false);
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      setSubmitMessage('发送失败，请检查网络连接后重试');
      setSubmitSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 组件挂载时获取数据
  useEffect(() => {

    // 添加小延迟确保组件完全挂载
    const timer = setTimeout(() => {
      fetchFeaturedContent();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  
  // 技能雷达图配置
  const radarOption = {
    title: {
      left: 'center',
      textStyle: {
        color: '#334155',
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    radar: {
      indicator: [
        { name: 'Java', max: 100 },
        { name: '数据库', max: 100 },
        { name: '前端开发', max: 100 },
        { name: '运维部署', max: 100 },
        { name: '架构设计', max: 100 },
        { name: 'AI技术', max: 100 },
      ],
      shape: 'polygon',
      radius: '70%',
      axisName: {
        color: '#64748b',
        fontSize: 12
      },
      splitLine: {
        lineStyle: {
          color: '#e2e8f0'
        }
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(22, 93, 255, 0.05)', 'rgba(22, 93, 255, 0.1)']
        }
      }
    },
    series: [{
      name: '技能水平',
      type: 'radar',
      data: [{
        value: [90, 80, 70, 65, 60, 75],
        name: '当前技能',
        areaStyle: {
          color: 'rgba(22, 93, 255, 0.2)'
        },
        lineStyle: {
          color: '#165DFF',
          width: 2
        },
        itemStyle: {
          color: '#165DFF'
        }
      }]
    }],
    color: ['#165DFF']
  };
  
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
      <main className="pt-20 pb-16">
        {/* 首页英雄区 */}
        <section id="home" className="min-h-screen flex items-center pt-20 pb-16 px-6">
          <div className="container mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-slate-800">探索 · 创造 · 突破</h1>
              <p className="text-xl md:text-2xl text-slate-600 mb-10">有趣的灵魂 · 专业的技术 · 前沿的视野</p>
              <a 
                href="#work" 
                className="inline-block px-8 py-3 gradient-btn rounded-full font-medium shadow-lg hover:shadow-xl transition-all"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById('work');
                  if (element) {
                    const offsetTop = element.offsetTop - 80; // 增加偏移量避免遮挡
                    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                  }
                }}
              >
                查看作品
              </a>
            </div>
          </div>
        </section>
        
        {/* 技能展示区 */}
        <section className="py-16 px-6 bg-white">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center text-slate-800">专业技能</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="glass-card p-6 fade-in">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#165DFF]/10 flex items-center justify-center text-[#165DFF] mr-4">
                    <i className="fas fa-server text-xl"></i>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800">服务端开发</h3>
                </div>
                <div className="progress-bar mb-2">
                  <div className="progress-fill" style={{ width: '90%' }}></div>
                </div>
                <p className="text-sm text-slate-500">Java、Spring Boot、PostgreSQL</p>
              </div>
              
              <div className="glass-card p-6 fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#36CFC9]/10 flex items-center justify-center text-[#36CFC9] mr-4">
                    <i className="fas fa-robot text-xl"></i>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800">AI Agent</h3>
                </div>
                <div className="progress-bar mb-2">
                  <div className="progress-fill" style={{ width: '60%' }}></div>
                </div>
                <p className="text-sm text-slate-500">Prompt、RAG、MCP、任务流</p>
              </div>
              
              <div className="glass-card p-6 fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#165DFF]/10 flex items-center justify-center text-[#165DFF] mr-4">
                    <i className="fas fa-code text-xl"></i>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800">前端开发</h3>
                </div>
                <div className="progress-bar mb-2">
                  <div className="progress-fill" style={{ width: '40%' }}></div>
                </div>
                <p className="text-sm text-slate-500">Vue、React</p>
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
        
        {/* 关于页 */}
        <section id="about" className="py-16 px-6 bg-white">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center text-slate-800">关于我</h2>
            
            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="fade-in">
                <h3 className="text-2xl font-semibold mb-6 text-slate-800">个人简介</h3>
                <p className="text-slate-600 mb-6">我是一名全栈Java开发工程师，拥有6年后端系统架构经验，目前专注于AI开发与智能体（Agent）技术，致力于构建高性能、智能化的企业级解决方案。</p>
                <p className="text-slate-600">我的核心方向是将传统业务系统与AI技术结合，通过LLM集成、RAG知识库和自动化任务流等，帮助业务实现数据驱动决策与流程智能化升级。</p>
              </div>
              
              <div className="fade-in" style={{ animationDelay: '0.2s' }}>
                <h3 className="text-2xl font-semibold mb-6 text-slate-800">技能雷达图</h3>
                <div className="w-full h-80 bg-white rounded-xl shadow-sm border border-slate-200">
                  <Suspense fallback={
                    <div className="flex items-center justify-center h-80">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-slate-600">加载图表中...</span>
                    </div>
                  }>
                    <ReactECharts option={radarOption} style={{ height: '320px', width: '100%' }} />
                  </Suspense>
                </div>
              </div>
            </div>
            
            <div className="max-w-3xl mx-auto mt-16 fade-in">
              <h3 className="text-2xl font-semibold mb-8 text-slate-800">职业经历</h3>
              
              <div className="relative pl-8">
                <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center">
                  <div className="timeline-dot"></div>
                  <div className="timeline-line flex-grow w-px"></div>
                </div>
                
                <div className="mb-10">
                  <h4 className="text-xl font-semibold text-slate-800">AI Agent开发</h4>
                  <p className="text-[#36CFC9] mb-2">金蝶 · 2022-至今</p>
                  <p className="text-slate-600">主导HR业务系统开发与AI Agent研发，实现人力资源全流程自动化与智能决策赋能。</p>
                </div>
                
                <div className="mb-10">
                  <h4 className="text-xl font-semibold text-slate-800">Java开发工程师</h4>
                  <p className="text-[#36CFC9] mb-2">金证优智 · 2021-2022</p>
                  <p className="text-slate-600">负责金融舆情系统与智能标注平台研发，赋能投研决策与风控管理。</p>
                </div>
                
                <div>
                  <h4 className="text-xl font-semibold text-slate-800">MES系统开发</h4>
                  <p className="text-[#36CFC9] mb-2">深科技  · 2019-2021</p>
                  <p className="text-slate-600">负责开发公司核心MES系统，多系统异构集成，推动智能制造数字化升级。</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* 博客页 */}
        <section id="blog" className="py-16 px-6 bg-slate-50">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center text-slate-800">推荐文章</h2>
            
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
                        <div className="flex items-center text-sm text-slate-500">
                          <i className="fas fa-eye mr-1"></i>
                          <span>{blog.views || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // 无数据状态
                <div className="col-span-2 text-center py-12">
                  <p className="text-slate-500">暂无推荐文章</p>
                </div>
              )}
            </div>
            
            <div className="text-center mt-12">
              <button 
                className="inline-block px-6 py-2 outline-btn rounded-full font-medium"
                onClick={() => navigate('/blogs')}
              >
                查看全部文章
              </button>
            </div>
          </div>
        </section>
        
        {/* 联系页 */}
        <section id="contact" className="py-16 px-6 bg-white">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center text-slate-800">联系我</h2>
            
            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="fade-in">
                <h3 className="text-2xl font-semibold mb-6 text-slate-800">发送消息</h3>
                
                <form className="space-y-6" onSubmit={handleContactFormSubmit}>
                  <div>
                    <label htmlFor="name" className="form-label">姓名 *</label>
                    <input 
                      type="text" 
                      id="name" 
                      name="name"
                      value={contactForm.name}
                      onChange={handleContactFormChange}
                      className="form-input" 
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="form-label">邮箱 *</label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email"
                      value={contactForm.email}
                      onChange={handleContactFormChange}
                      className="form-input" 
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="form-label">主题</label>
                    <input 
                      type="text" 
                      id="subject" 
                      name="subject"
                      value={contactForm.subject}
                      onChange={handleContactFormChange}
                      className="form-input" 
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="form-label">消息 *</label>
                    <textarea 
                      id="message" 
                      name="message"
                      value={contactForm.message}
                      onChange={handleContactFormChange}
                      rows={4} 
                      className="form-input"
                      required
                    ></textarea>
                  </div>
                  
                  {submitMessage && (
                    <div className={`p-3 rounded-lg text-sm ${
                      submitSuccess 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {submitMessage}
                    </div>
                  )}
                  
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-3 gradient-btn rounded-full font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? '发送中...' : '发送消息'}
                  </button>
                </form>
              </div>
              
              <div className="fade-in" style={{ animationDelay: '0.2s' }}>
                <h3 className="text-2xl font-semibold mb-6 text-slate-800">联系方式</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-[#165DFF]/10 flex items-center justify-center text-[#165DFF] mr-4 mt-1">
                      <i className="fas fa-envelope"></i>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800">邮箱</h4>
                      <p className="text-slate-600">hjxlog@gmail.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-[#36CFC9]/10 flex items-center justify-center text-[#36CFC9] mr-4 mt-1">
                      <i className="fab fa-weixin"></i>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800">微信</h4>
                      <p className="text-slate-600">hjxlog（添加请备注来意）</p>
                    </div>
                  </div>
                  
                  {/* <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-[#52C41A]/10 flex items-center justify-center text-[#52C41A] mr-4 mt-1">
                      <i className="fab fa-qq"></i>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800">QQ</h4>
                      <p className="text-slate-600">123456789</p>
                    </div>
                  </div> */}
                  
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-[#165DFF]/10 flex items-center justify-center text-[#165DFF] mr-4 mt-1">
                      <i className="fas fa-map-marker-alt"></i>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800">地址</h4>
                      <p className="text-slate-600">中国深圳市南山区高新南七道</p>
                    </div>
                  </div>
                  
                  {/* <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-[#FF6B6B]/10 flex items-center justify-center text-[#FF6B6B] mr-4 mt-1">
                      <i className="fas fa-video"></i>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800">哔哩哔哩</h4>
                      <p className="text-slate-600">@hjxlog</p>
                    </div>
                  </div> */}
                </div>
                
                <h3 className="text-2xl font-semibold mt-10 mb-6 text-slate-800">社交媒体</h3>
                
                <div className="flex space-x-4">
                  <a href="#" className="w-10 h-10 rounded-full bg-[#165DFF]/10 flex items-center justify-center text-[#165DFF] hover:bg-[#165DFF] hover:text-white transition">
                    <i className="fab fa-twitter"></i>
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-[#165DFF]/10 flex items-center justify-center text-[#165DFF] hover:bg-[#165DFF] hover:text-white transition">
                    <i className="fab fa-linkedin-in"></i>
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-[#165DFF]/10 flex items-center justify-center text-[#165DFF] hover:bg-[#165DFF] hover:text-white transition">
                    <i className="fab fa-dribbble"></i>
                  </a>
                  <a target="_blank" href="https://github.com/hjxlog" className="w-10 h-10 rounded-full bg-[#165DFF]/10 flex items-center justify-center text-[#165DFF] hover:bg-[#165DFF] hover:text-white transition">
                    <i className="fab fa-github"></i>
                  </a>
                </div>
              </div>
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