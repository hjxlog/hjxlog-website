import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { 
  ArrowLeft, Calendar, Clock, Tag, ChevronUp, Share2, 
  Copy, Check, Terminal, BookOpen, Hash, ExternalLink 
} from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import TableOfContents from '@/components/TableOfContents';
import { useBackToTop } from '@/hooks/useBackToTop';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

// macOS 风格代码块组件
const CodeBlock = ({ language, children }: { language: string; children: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-slate-700/50 shadow-xl bg-[#1e1e1e]">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#252526] border-b border-slate-700/50">
        <div className="flex space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 transition-colors"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] hover:bg-[#ffbd2e]/80 transition-colors"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f] hover:bg-[#27c93f]/80 transition-colors"></div>
        </div>
        <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
          <Terminal size={12} />
          {language || 'text'}
        </div>
        <button 
          onClick={handleCopy}
          className="text-slate-400 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        </button>
      </div>
      
      {/* Code Content */}
      <div className="relative group">
        <SyntaxHighlighter
          language={language || 'text'}
          style={atomDark}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          }}
          showLineNumbers={true}
          wrapLines={true}
        >
          {children}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

// Markdown 包装组件
const MarkdownRenderer = ({ content }: { content: string }) => {
  const idCounts: Record<string, number> = {};

  const getNodeText = (node: any): string => {
    if (['string', 'number'].includes(typeof node)) return node.toString();
    if (node instanceof Array) return node.map(getNodeText).join('');
    if (typeof node === 'object' && node) {
       if (node.props && node.props.children) return getNodeText(node.props.children);
    }
    return '';
  };

  const getUniqueId = (text: any) => {
    const str = getNodeText(text);
    let id = str.toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    if (idCounts[id]) {
      const count = idCounts[id];
      idCounts[id]++;
      id = `${id}-${count}`;
    } else {
      idCounts[id] = 1;
    }
    return id;
  };

  return (
    <ReactMarkdown 
      remarkPlugins={[remarkGfm]}
      components={{
        pre: ({ children }: any) => <>{children}</>,
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : '';
          
          return !inline ? (
            <CodeBlock language={language} children={String(children).replace(/\n$/, '')} />
          ) : (
            <code className="px-1.5 py-0.5 rounded-md bg-slate-100 text-pink-500 font-mono text-sm border border-slate-200" {...props}>
              {children}
            </code>
          );
        },
        img({ src, alt, ...props }: any) {
          return (
            <div className="my-8">
              <div className="relative rounded-xl overflow-hidden shadow-lg border border-slate-200/50 group">
                <img 
                  src={src} 
                  alt={alt} 
                  className="w-full h-auto max-h-[600px] object-contain bg-slate-50"
                  {...props}
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-xl pointer-events-none"></div>
              </div>
              {alt && (
                <p className="text-center text-sm text-slate-500 mt-3 font-medium flex items-center justify-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                  {alt}
                </p>
              )}
            </div>
          );
        },
        a({ href, children, ...props }: any) {
          const isInternal = href?.startsWith('/') || href?.includes(window.location.hostname);
          return (
            <a 
              href={href} 
              target={isInternal ? "_self" : "_blank"}
              rel={isInternal ? "" : "noopener noreferrer"}
              className="inline-flex items-center gap-0.5 text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-600 underline-offset-4 transition-all font-medium"
              {...props}
            >
              {children}
              {!isInternal && <ExternalLink size={12} className="opacity-70" />}
            </a>
          );
        },
        blockquote({ children }: any) {
          return (
            <blockquote className="border-l-4 border-blue-500 bg-blue-50/50 pl-6 py-4 my-6 rounded-r-lg italic text-slate-700 not-italic">
              <div className="relative">
                <span className="absolute -left-10 -top-2 text-4xl text-blue-200 font-serif">"</span>
                {children}
              </div>
            </blockquote>
          );
        },
        h1: ({ children, ...props }: any) => {
          const id = getUniqueId(children);
          return <h1 id={id} className="text-3xl font-bold mt-8 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2 group" {...props}>
            {children}
          </h1>;
        },
        h2: ({ children, ...props }: any) => {
          const id = getUniqueId(children);
          return <h2 id={id} className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2 group" {...props}>
            {children}
          </h2>;
        },
        h3: ({ children, ...props }: any) => {
          const id = getUniqueId(children);
          return <h3 id={id} className="text-xl font-bold mt-6 mb-3 flex items-center gap-2" {...props}>{children}</h3>;
        },
        ul: ({ children }: any) => <ul className="list-disc list-outside ml-6 my-3 space-y-1 text-slate-700">{children}</ul>,
        ol: ({ children }: any) => <ol className="list-decimal list-outside ml-6 my-3 space-y-1 text-slate-700">{children}</ol>,
        li: ({ children }: any) => <li className="pl-1">{children}</li>,
        p: ({ children }: any) => <p className="my-2 leading-relaxed text-slate-700 text-[1rem]">{children}</p>,
        table: ({ children }: any) => (
          <div className="overflow-x-auto my-6 rounded-lg border border-slate-200 shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">{children}</table>
          </div>
        ),
        thead: ({ children }: any) => <thead className="bg-slate-50">{children}</thead>,
        th: ({ children }: any) => <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{children}</th>,
        td: ({ children }: any) => <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 border-t border-slate-100">{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
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
      <div className="relative min-h-screen bg-slate-50 overflow-hidden flex items-center justify-center">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-blue-50/50 to-transparent -z-10"></div>
        <div className="absolute right-[-10%] top-[20%] w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px] -z-10 animate-blob"></div>
        <div className="absolute left-[-10%] bottom-[20%] w-[400px] h-[400px] bg-purple-100/40 rounded-full blur-[100px] -z-10 animate-blob animation-delay-2000"></div>
        
        <PublicNav />
        <LoadingSpinner size="lg" text="正在加载内容..." />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="relative min-h-screen bg-slate-50 overflow-hidden flex flex-col items-center justify-center">
        <PublicNav />
        <div className="text-center z-10 p-8 glass-panel rounded-2xl">
          <h1 className="text-3xl font-bold mb-4 text-slate-800">404</h1>
          <p className="mb-6 text-slate-600">抱歉，未找到该文章。</p>
          <button 
            onClick={() => navigate('/blogs')} 
            className="bg-slate-900 text-white px-6 py-2.5 rounded-full hover:bg-slate-800 transition-all flex items-center gap-2 mx-auto"
          >
            <ArrowLeft size={16} />
            返回博客列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#f8fafc] selection:bg-blue-100 selection:text-blue-900">
      <PublicNav />

      {/* Dynamic Background - 更淡雅的背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-slate-100/80 to-transparent"></div>
        <div className="absolute right-[-10%] top-[-10%] w-[600px] h-[600px] bg-blue-50/40 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute left-[-10%] top-[10%] w-[500px] h-[500px] bg-purple-50/40 rounded-full blur-[120px] opacity-40"></div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8 pt-24 pb-20 max-w-7xl">
        {/* Top Navigation Bar */}
        <div className="mb-6 flex justify-between items-center">
          <button 
            onClick={() => navigate('/blogs')} 
            className="group flex items-center text-slate-500 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/60"
          >
            <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">返回列表</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           {/* Main Article Content - 增加宽度占比 */}
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.4 }}
             className="lg:col-span-9 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12"
           >
              {/* Immersive Header Section */}
              <header className={`relative -mx-8 -mt-8 md:-mx-12 md:-mt-12 mb-12 overflow-hidden rounded-t-2xl ${post.cover_image ? 'text-white' : 'mb-10 pb-8 border-b border-slate-100'}`}>
                 {post.cover_image && (
                   <div className="absolute inset-0 z-0">
                     <img 
                       src={post.cover_image} 
                       alt={post.title} 
                       className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 backdrop-blur-[2px]"></div>
                   </div>
                 )}

                 <div className={`relative z-10 px-8 md:px-12 flex flex-col justify-end ${post.cover_image ? 'pt-32 pb-12 min-h-[400px]' : 'pt-12'}`}>
                     <div className="flex flex-wrap gap-3 mb-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md border ${
                          post.cover_image 
                            ? 'bg-white/20 text-white border-white/30' 
                            : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                          {post.category}
                        </span>
                        {post.tags.map(tag => (
                          <span key={tag} className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md border ${
                            post.cover_image
                              ? 'bg-black/30 text-slate-200 border-white/10'
                              : 'bg-slate-50 text-slate-500 border-slate-200'
                          }`}>
                             {tag}
                          </span>
                        ))}
                     </div>

                     <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight tracking-tight ${post.cover_image ? 'text-white drop-shadow-md' : 'text-slate-900'}`}>
                        {post.title}
                     </h1>

                     <div className={`flex flex-wrap items-center gap-6 text-sm font-medium ${post.cover_image ? 'text-slate-200' : 'text-slate-500'}`}>
                        <div className="flex items-center gap-2">
                           <img src="https://file.hjxlog.com/blog/images/avatar.jpg" alt="Author" className="w-8 h-8 rounded-full border-2 border-white/20" />
                           <span className={post.cover_image ? 'text-white' : 'text-slate-700'}>JianXian</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <Calendar size={16} />
                           {formatDate(post.created_at)}
                        </div>
                        <div className="flex items-center gap-1.5">
                           <Clock size={16} />
                           <span>5 min read</span>
                        </div>
                     </div>
                 </div>
              </header>

              {/* Markdown Content */}
              <article id="blog-content" className="prose prose-lg max-w-none prose-slate prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-blue-600 hover:prose-a:text-blue-700 prose-img:rounded-lg prose-headings:scroll-mt-20">
                 <MarkdownRenderer content={post.content} />
              </article>

              {/* Article Footer */}
              <div className="mt-16 pt-8 border-t border-slate-100 flex justify-between items-center text-sm text-slate-400">
                 <p>最后更新于 {formatDateTime(post.updated_at || post.created_at)}</p>
              </div>
           </motion.div>

           {/* Sidebar (TOC) - 更加紧凑 */}
           <div className="lg:col-span-3 lg:sticky lg:top-24 space-y-6">
              {hasToc && (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="hidden lg:block bg-white/80 backdrop-blur-md rounded-xl shadow-sm border border-slate-100 p-5"
                >
                   <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                      目录
                   </h3>
                   <TableOfContents content={post.content} showHeader={false} className="max-h-[60vh]" />
                </motion.div>
              )}
              
              {/* Related Posts */}
              {relatedPosts.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="hidden lg:block bg-white/80 backdrop-blur-md rounded-xl shadow-sm border border-slate-100 p-5"
                >
                   <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                      相关阅读
                   </h3>
                   <div className="space-y-3">
                      {relatedPosts.map(post => (
                         <a 
                           key={post.id}
                           href={`/blog/${post.id}`}
                           className="block group"
                         >
                            <h4 className="text-sm font-medium text-slate-700 group-hover:text-blue-600 line-clamp-2 mb-1 transition-colors">
                               {post.title}
                            </h4>
                            <span className="text-xs text-slate-400 block">
                               {formatDate(post.created_at)}
                            </span>
                         </a>
                      ))}
                   </div>
                </motion.div>
              )}
           </div>
        </div>
        
        {/* Mobile Related Posts (Below Content) */}
        <div className="lg:hidden mt-12">
           <h3 className="text-lg font-bold text-slate-900 mb-6">相关阅读</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedPosts.map(post => (
                 <div key={post.id} onClick={() => navigate(`/blog/${post.id}`)} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 active:scale-95 transition-transform">
                    <h4 className="font-medium text-slate-800 mb-2">{post.title}</h4>
                    <div className="flex justify-between items-center text-xs text-slate-500">
                       <span>{formatDate(post.created_at)}</span>
                       <span className="text-blue-500">阅读</span>
                    </div>
                 </div>
              ))}
           </div>
        </div>

      </div>

      <Footer />
      
      {/* Scroll to Top Button */}
      <motion.button
        id="backToTop"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-24 right-6 w-12 h-12 rounded-full bg-slate-900 text-white shadow-lg flex items-center justify-center opacity-0 invisible transition-all z-50 hover:bg-blue-600"
      >
        <ChevronUp size={20} />
      </motion.button>
    </div>
  );
};

export default BlogDetail;