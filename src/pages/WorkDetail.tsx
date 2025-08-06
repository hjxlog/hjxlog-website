import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useBackToTop } from '@/hooks/useBackToTop';
import { apiRequest } from '../config/api';
// 动态导入 Markdown 相关模块
const ReactMarkdown = React.lazy(() => import('react-markdown'));

// Markdown 包装组件
const MarkdownRenderer = ({ content }: { content: string }) => {
  return (
    <React.Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded">加载内容...</div>}>
      <ReactMarkdown 
        components={{
          code({ className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;
            return !isInline ? (
              <CodeBlock
                 language={match[1]}
                 children={String(children).replace(/\n$/, '')}
               />
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          img({ src, alt, ...props }: any) {
            return (
              <div className="my-6 text-center">
                <img 
                  src={src} 
                  alt={alt} 
                  className="max-w-full h-auto mx-auto rounded-lg shadow-md max-h-96 object-contain"
                  {...props}
                />
                {alt && (
                  <p className="text-sm text-gray-500 mt-2 italic">{alt}</p>
                )}
              </div>
            );
          },
          a({ href, children, ...props }: any) {
            return (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#165DFF] hover:text-[#0E42D2] underline"
                {...props}
              >
                {children}
              </a>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </React.Suspense>
  );
};
// 代码高亮组件
const CodeBlock = ({ language, children }: { language: string; children: string }) => {
  const codeRef = React.useRef<HTMLElement>(null);
  
  React.useEffect(() => {
    if (codeRef.current && typeof window !== 'undefined' && (window as any).Prism) {
      (window as any).Prism.highlightElement(codeRef.current);
    }
  }, [children]);
  
  return (
    <pre className="language-" style={{
      background: '#2d3748',
      color: '#e2e8f0',
      padding: '1rem',
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      lineHeight: '1.5',
      overflow: 'auto'
    }}>
      <code ref={codeRef} className={`language-${language}`}>
        {children}
      </code>
    </pre>
  );
};
interface WorkDetail {
  id: number;
  title: string;
  description: string;
  cover_image: string;
  category: string;
  tags: string[];
  project_url?: string;
  github_url?: string;
  created_at: string;
  content: string;
  technologies: string[];
  features: string[];
  challenges: string[];
  screenshots: string[];
  status: string;
}

export default function WorkDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [work, setWork] = useState<WorkDetail | null>(null);
  const [relatedWorks, setRelatedWorks] = useState<WorkDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeScreenshot, setActiveScreenshot] = useState(0);
  
  // 使用回到顶部功能
  useBackToTop();

  // 获取作品详情
  const fetchWorkDetail = async () => {
    if (!id) {
      setError('作品ID不存在');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await apiRequest(`/api/works/${id}`);
      
      if (result.success) {
        setWork(result.data);
        // 获取相关作品
        await fetchRelatedWorks(result.data.category, result.data.id);
      } else {
        throw new Error(result.message || '获取作品详情失败');
      }
    } catch (error) {
      console.error('获取作品详情失败:', error);
      setError('获取作品详情失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取相关作品
  const fetchRelatedWorks = async (category: string, currentId: number) => {
    try {
      const result = await apiRequest(`/api/works?category=${encodeURIComponent(category)}&limit=6`);
      
      if (result.success && Array.isArray(result.data)) {
        // 过滤掉当前作品，只取前3个
        const filtered = result.data.filter((work: WorkDetail) => work.id !== currentId).slice(0, 3);
        setRelatedWorks(filtered);
      } else {
        setRelatedWorks([]);
      }
    } catch (error) {
      console.error('获取相关作品失败:', error);
      setRelatedWorks([]);
    }
  };

  useEffect(() => {
    fetchWorkDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !work) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-red-500 mb-4">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h2 className="text-2xl font-semibold text-slate-600 mb-4">加载失败</h2>
          <p className="text-slate-500 mb-6">{error || '作品不存在'}</p>
          <div className="space-x-4">
            <button 
              className="px-6 py-3 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors"
              onClick={() => navigate('/works')}
            >
              返回作品列表
            </button>
            <button 
              className="px-6 py-3 bg-[#165DFF] text-white rounded-lg hover:bg-[#165DFF]/90 transition-colors"
              onClick={fetchWorkDetail}
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />

      <main className="pt-16">
        {/* 头部横幅 */}
        <div className="relative h-96 overflow-hidden">
          <img
            src={work.cover_image}
            alt={work.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{work.title}</h1>
              <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto px-4">
                {work.description}
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* 主要内容 */}
            <div className="lg:col-span-2">
              {/* 项目信息 */}
              <div className="bg-white rounded-xl p-8 shadow-sm mb-8">
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <span className="px-4 py-2 bg-[#165DFF]/10 text-[#165DFF] rounded-full font-medium">
                    {work.category}
                  </span>
                  <span className="text-slate-500">
                    <i className="fas fa-calendar mr-2"></i>
                    {new Date(work.created_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                  {work.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* 项目内容 */}
                <div className="prose prose-slate max-w-none">
                  <MarkdownRenderer content={work.content} />
                </div>
              </div>

              {/* 项目截图 */}
              {work.screenshots && work.screenshots.length > 0 && (
                <div className="bg-white rounded-xl p-8 shadow-sm mb-8">
                  <h2 className="text-2xl font-semibold text-slate-800 mb-6">项目截图</h2>
                  
                  <div className="mb-6">
                    <img
                      src={work.screenshots[activeScreenshot]}
                      alt={`截图 ${activeScreenshot + 1}`}
                      className="w-full rounded-lg shadow-md"
                    />
                  </div>
                  
                  <div className="flex space-x-4 overflow-x-auto pb-2">
                    {work.screenshots.map((screenshot, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveScreenshot(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                          activeScreenshot === index
                            ? 'border-[#165DFF]'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={screenshot}
                          alt={`缩略图 ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 侧边栏 */}
            <div className="space-y-8">
              {/* 技术栈 */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  <i className="fas fa-code mr-2 text-[#165DFF]"></i>
                  技术栈
                </h3>
                <div className="space-y-2">
                  {work.technologies.map((tech, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 text-slate-600"
                    >
                      <i className="fas fa-check text-green-500 text-sm"></i>
                      <span>{tech}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 核心功能 */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  <i className="fas fa-star mr-2 text-[#165DFF]"></i>
                  核心功能
                </h3>
                <div className="space-y-2">
                  {work.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 text-slate-600"
                    >
                      <i className="fas fa-check text-green-500 text-sm"></i>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 技术挑战 */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  <i className="fas fa-lightbulb mr-2 text-[#165DFF]"></i>
                  技术挑战
                </h3>
                <div className="space-y-2">
                  {work.challenges.map((challenge, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 text-slate-600"
                    >
                      <i className="fas fa-cog text-orange-500 text-sm"></i>
                      <span>{challenge}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 项目链接 - 只有当存在在线预览或源代码时才显示 */}
              {(work.project_url || work.github_url) && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">
                    <i className="fas fa-link mr-2 text-[#165DFF]"></i>
                    项目链接
                  </h3>
                  <div className="space-y-3">
                    {work.project_url && (
                      <a
                        href={work.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <i className="fas fa-external-link-alt text-[#165DFF]"></i>
                        <span className="text-slate-700">在线预览</span>
                      </a>
                    )}
                    {work.github_url && (
                      <a
                        href={work.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <i className="fab fa-github text-slate-600"></i>
                        <span className="text-slate-700">源代码</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 相关作品推荐 */}
          {relatedWorks.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-semibold text-slate-800 mb-8 text-center">
                相关作品推荐
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedWorks.map((relatedWork) => (
                  <div
                    key={relatedWork.id}
                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/works/${relatedWork.id}`)}
                  >
                    <img
                      src={relatedWork.cover_image}
                      alt={relatedWork.title}
                      className="w-full h-40 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=250&fit=crop';
                      }}
                    />
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-[#165DFF]/10 text-[#165DFF] rounded text-xs font-medium">
                          {relatedWork.category}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-800 mb-2 line-clamp-1">
                        {relatedWork.title}
                      </h3>
                      <p className="text-slate-600 text-sm line-clamp-2">
                        {relatedWork.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {relatedWork.tags.slice(0, 2).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {relatedWork.tags.length > 2 && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                            +{relatedWork.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* 回到顶部按钮 */}
      <button id="backToTop" className="fixed bottom-8 right-8 w-12 h-12 rounded-full bg-[#165DFF] text-white shadow-lg flex items-center justify-center opacity-0 invisible transition-all">
        <i className="fas fa-arrow-up"></i>
      </button>
      
      <Footer />
    </div>
  );
}