import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import TableOfContents from '@/components/TableOfContents';
import { useBackToTop } from '@/hooks/useBackToTop';
// 移除对lib/api的依赖，直接调用服务器API
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';
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
        },
        h1: ({ children, ...props }: any) => {
          const text = String(children);
          const id = text.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
          return <h1 id={id} {...props}>{children}</h1>;
        },
        h2: ({ children, ...props }: any) => {
          const text = String(children);
          const id = text.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
          return <h2 id={id} {...props}>{children}</h2>;
        },
        h3: ({ children, ...props }: any) => {
          const text = String(children);
          const id = text.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
          return <h3 id={id} {...props}>{children}</h3>;
        },
        h4: ({ children, ...props }: any) => {
          const text = String(children);
          const id = text.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
          return <h4 id={id} {...props}>{children}</h4>;
        },
        h5: ({ children, ...props }: any) => {
          const text = String(children);
          const id = text.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
          return <h5 id={id} {...props}>{children}</h5>;
        },
        h6: ({ children, ...props }: any) => {
          const text = String(children);
          const id = text.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
          return <h6 id={id} {...props}>{children}</h6>;
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
  const [prismLoaded, setPrismLoaded] = React.useState(false);
  
  // 动态加载 Prism.js
  React.useEffect(() => {
    const loadPrism = async () => {
      if (typeof window !== 'undefined' && !(window as any).Prism) {
        try {
          // 加载 Prism CSS
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = 'https://unpkg.com/prismjs@1.29.0/themes/prism-tomorrow.css';
          document.head.appendChild(cssLink);
          
          // 加载 Prism 核心
          await new Promise((resolve, reject) => {
            const script1 = document.createElement('script');
            script1.src = 'https://unpkg.com/prismjs@1.29.0/components/prism-core.min.js';
            script1.onload = resolve;
            script1.onerror = reject;
            document.head.appendChild(script1);
          });
          
          // 加载 Prism 自动加载器
          await new Promise((resolve, reject) => {
            const script2 = document.createElement('script');
            script2.src = 'https://unpkg.com/prismjs@1.29.0/plugins/autoloader/prism-autoloader.min.js';
            script2.onload = resolve;
            script2.onerror = reject;
            document.head.appendChild(script2);
          });
          
          setPrismLoaded(true);
        } catch (error) {
          console.warn('Failed to load Prism.js:', error);
        }
      } else if ((window as any).Prism) {
        setPrismLoaded(true);
      }
    };
    
    loadPrism();
  }, []);
  
  // 高亮代码
  React.useEffect(() => {
    if (prismLoaded && codeRef.current && (window as any).Prism) {
      (window as any).Prism.highlightElement(codeRef.current);
    }
  }, [prismLoaded, children]);
  
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

interface BlogPost {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  created_at: string;
  updated_at?: string;
  category: string;
  tags: string[];
  cover_image: string;
  published: boolean;
  featured?: boolean;
}

interface RelatedPost {
  id: number;
  title: string;
  excerpt: string;
  cover_image: string;
  created_at: string;
  category: string;
}

const BlogDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasToc, setHasToc] = useState(false);

  // 使用回到顶部功能
  useBackToTop();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  useEffect(() => {
    // 获取博客详情
    const fetchPost = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/blogs/${id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.message || '获取博客详情失败');
        }
        
        const blogData = result.data;
        if (!blogData) {
          throw new Error('博客数据为空');
        }
        
        setPost(blogData);
        
        // 检测是否有目录
        if (blogData.content) {
          // 移除代码块中的内容，避免误判
          const contentWithoutCodeBlocks = blogData.content.replace(/```[\s\S]*?```/g, '');
          // 检测是否有标题（H1-H6）
          const hasHeadings = /^#{1,6}\s+.+$/m.test(contentWithoutCodeBlocks);
          setHasToc(hasHeadings);
        } else {
          setHasToc(false);
        }
        
      } catch (error: any) {
        console.error('❌ [BlogDetail] API获取失败:', error);
        setError(`获取博客详情失败: ${error.message}`);
        
        toast.error('获取博客详情失败');
      } finally {
        setLoading(false);
      }
    };

    // 获取相关博客
    const fetchRelatedPosts = async () => {
      try {
        // 获取更多博客以便过滤后仍有足够的相关博客
        const response = await fetch(`${API_BASE_URL}/api/blogs?limit=6&published=true`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();

        
        if (result.success && result.data && result.data.blogs) {
          // 过滤掉当前博客，然后取前3篇
          const filteredBlogs = result.data.blogs.filter((blog: any) => blog.id !== parseInt(id!));
          const relatedBlogs = filteredBlogs.slice(0, 3);
          setRelatedPosts(relatedBlogs);

        } else {
          throw new Error(result.message || '获取相关博客失败');
        }
      } catch (error) {
        console.error('❌ [BlogDetail] 相关博客获取失败:', error);

      }
    };

    if (id) {
      fetchPost();
      fetchRelatedPosts();
      incrementViews();
    }
  }, [id]);

  // 增加浏览量
  const incrementViews = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blogs/${id}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();

      }
    } catch (error: any) {
      console.error('❌ [BlogDetail] 增加浏览量失败:', error);
    }
  };



  if (loading) {
    return (
      <div className="relative min-h-screen bg-slate-50">
        <PublicNav />
        <div className="container mx-auto px-4 py-8 pt-24">
          <LoadingSpinner size="lg" text="正在加载博客详情..." />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="relative min-h-screen bg-slate-50">
        <PublicNav />
        <div className="container mx-auto px-4 py-8 pt-24 text-center">
          <h1 className="text-2xl font-bold mb-4">Blog Post Not Found</h1>
          <p className="mb-4">The blog post you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={() => navigate('/blogs')} 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition duration-300"
          >
            Back to Blog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50">
      <PublicNav />
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* 返回按钮 */}
        <button 
          onClick={() => navigate('/blogs')} 
          className="flex items-center text-blue-500 hover:text-blue-700 mb-6 transition duration-300"
        >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to Blog
      </button>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6">
            <ErrorMessage 
              message={error} 
              onDismiss={() => setError(null)}
            />
          </div>
        )}

      {/* 博客标题和元信息 */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
        <div className="flex flex-wrap items-center text-gray-600 mb-4">

          <span className="mr-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDateTime(post.created_at)}
          </span>
          <span className="mr-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            {post.category}
          </span>

        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags.map((tag, index) => (
            <span key={index} className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">{tag}</span>
          ))}
        </div>
      </div>

      {/* 特色图片 */}
      <div className="mb-8">
        <div className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden rounded-lg shadow-md">
          <img 
            src={post.cover_image} 
            alt={post.title} 
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>

      {/* 博客内容区域 */}
      <div className={`grid grid-cols-1 ${hasToc ? 'lg:grid-cols-4' : 'lg:grid-cols-1'} gap-8 mb-8`}>
        {/* 主要内容 */}
        <div className={hasToc ? 'lg:col-span-3' : 'lg:col-span-1'}>
          <div className="prose prose-lg max-w-none">
            <MarkdownRenderer content={post.content} />
          </div>
        </div>
        
        {/* 目录侧边栏 - 只在有目录时显示 */}
        {hasToc && (
          <div className="lg:col-span-1">
            <TableOfContents content={post.content} />
          </div>
        )}
      </div>





      {/* 相关博客 */}
      <div>
        <h2 className="text-2xl font-bold mb-6">相关博客</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {relatedPosts.map((relatedPost) => (
            <div key={relatedPost.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition duration-300">
              <img 
                src={relatedPost.cover_image} 
                alt={relatedPost.title} 
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mb-2">{relatedPost.category}</span>
                <h3 className="text-lg font-semibold mb-2">{relatedPost.title}</h3>
                <p className="text-gray-600 mb-3">{relatedPost.excerpt}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{formatDate(relatedPost.created_at)}</span>
                  <button 
                    onClick={() => navigate(`/blog/${relatedPost.id}`)}
                    className="text-blue-500 hover:text-blue-700 text-sm font-medium transition duration-300"
                  >
                    阅读更多
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
      
      {/* 回到顶部按钮 */}
      <button id="backToTop" className="fixed bottom-8 right-8 w-12 h-12 rounded-full bg-[#165DFF] text-white shadow-lg flex items-center justify-center opacity-0 invisible transition-all">
        <i className="fas fa-arrow-up"></i>
      </button>
      
      <Footer />
    </div>
  );
};

export default BlogDetail;