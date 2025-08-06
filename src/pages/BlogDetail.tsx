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
  const [remarkGfm, setRemarkGfm] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const isMountedRef = React.useRef(true);
  
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  React.useEffect(() => {
    if (!loading) return;
    
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        setError(true);
        setLoading(false);
      }
    }, 5000);
    
    import('remark-gfm')
      .then(module => {
        if (isMountedRef.current) {
          setRemarkGfm(module.default);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMountedRef.current) {
          setError(true);
          setLoading(false);
        }
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [loading]);
  
  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-64 rounded"></div>;
  }
  
  if (error || !remarkGfm) {
    // 降级到基础 ReactMarkdown
    return (
      <React.Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded"></div>}>
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
                    className="max-w-full h-auto mx-auto rounded-lg shadow-md" 
                    {...props} 
                  />
                  {alt && <p className="text-sm text-gray-600 mt-2">{alt}</p>}
                </div>
              );
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </React.Suspense>
    );
  }
  
  return (
    <React.Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded"></div>}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
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
  likes?: number;
  comments?: Comment[];
}

interface Comment {
  id: number;
  author: string;
  content: string;
  date: string;
  avatar: string;
  admin_reply?: string;
  admin_reply_at?: string;
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
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

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
    // 获取博客文章详情
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
        setComments(blogData.comments || []);
        setLikeCount(blogData.likes || 0);
        
      } catch (error: any) {
        console.error('❌ [BlogDetail] API获取失败:', error);
        setError(`获取博客详情失败: ${error.message}`);
        
        toast.error('获取博客详情失败');
      } finally {
        setLoading(false);

      }
    };

    // 获取相关文章
    const fetchRelatedPosts = async () => {
      try {
        // 获取更多文章以便过滤后仍有足够的相关文章
        const response = await fetch(`${API_BASE_URL}/api/blogs?limit=6&published=true`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();

        
        if (result.success && result.data && result.data.blogs) {
          // 过滤掉当前文章，然后取前3篇
          const filteredBlogs = result.data.blogs.filter((blog: any) => blog.id !== parseInt(id!));
          const relatedBlogs = filteredBlogs.slice(0, 3);
          setRelatedPosts(relatedBlogs);

        } else {
          throw new Error(result.message || '获取相关文章失败');
        }
      } catch (error) {
        console.error('❌ [BlogDetail] 相关文章获取失败:', error);

      }
    };

    if (id) {
      fetchPost();
      fetchRelatedPosts();
      fetchComments();
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

  const handleLike = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blogs/${id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setLikeCount(result.likes);
          setLiked(!liked);
          toast.success('点赞成功！感谢您的支持 ❤️');
        } else {
          // IP限制或其他业务逻辑错误
          toast.info(result.message || '您已经点过赞了');
        }
      } else {
        const errorResult = await response.json();
        toast.error(errorResult.message || '点赞失败，请稍后重试');
      }
    } catch (error: any) {
      console.error('❌ [BlogDetail] 点赞失败:', error);
      toast.error('网络错误，请稍后重试');
    }
  };

  // 获取评论
  const fetchComments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blogs/${id}/comments`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setComments(result.data.map((comment: any) => ({
            id: comment.id,
            author: comment.author_name,
            content: comment.content,
            date: new Date(comment.created_at).toLocaleDateString(),
            avatar: '/default-avatar.svg',
            admin_reply: comment.admin_reply,
            admin_reply_at: comment.admin_reply_at ? new Date(comment.admin_reply_at).toLocaleDateString() : undefined
          })));
        }
      }
    } catch (error: any) {
      console.error('❌ [BlogDetail] 获取评论失败:', error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newComment.trim() || !commentAuthor.trim()) {
      toast.error('请填写姓名和评论内容');
      return;
    }

    setSubmittingComment(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/blogs/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          author_name: commentAuthor,
          author_email: commentEmail,
          content: newComment
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success('评论提交成功！');
          setNewComment('');
          setCommentAuthor('');
          setCommentEmail('');
          // 重新获取评论列表
          fetchComments();
        }
      } else {
        toast.error('评论提交失败，请稍后重试');
      }
    } catch (error: any) {
      console.error('❌ [BlogDetail] 提交评论失败:', error);
      toast.error('评论提交失败，请稍后重试');
    } finally {
      setSubmittingComment(false);
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {post.author}
          </span>
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
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {likeCount} likes
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
        {/* 主要内容 */}
        <div className="lg:col-span-3">
          <div className="prose prose-lg max-w-none">
            <MarkdownRenderer content={post.content} />
          </div>
        </div>
        
        {/* 目录侧边栏 */}
        <div className="lg:col-span-1">
          <TableOfContents content={post.content} />
        </div>
      </div>

      {/* 点赞按钮 */}
      <div className="flex justify-center mb-8">
        <button 
          onClick={handleLike}
          className={`flex items-center px-6 py-3 rounded-full transition duration-300 ${liked ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill={liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {liked ? '已点赞' : '点赞'} ({likeCount})
        </button>
      </div>

      {/* 评论区 */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">评论 ({comments.length})</h2>
        
        {/* 评论表单 */}
        <form onSubmit={handleCommentSubmit} className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="commentAuthor" className="block text-gray-700 font-medium mb-2">姓名 *</label>
              <input
                id="commentAuthor"
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入您的姓名"
                value={commentAuthor}
                onChange={(e) => setCommentAuthor(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="commentEmail" className="block text-gray-700 font-medium mb-2">邮箱</label>
              <input
                id="commentEmail"
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入您的邮箱（可选）"
                value={commentEmail}
                onChange={(e) => setCommentEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="comment" className="block text-gray-700 font-medium mb-2">评论内容 *</label>
            <textarea
              id="comment"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请在此输入您的评论..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={submittingComment}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition duration-300 flex items-center"
          >
            {submittingComment && (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {submittingComment ? '发布中...' : '发布评论'}
          </button>
        </form>
        
        {/* 评论列表 */}
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex space-x-4">
                <img 
                  src={comment.avatar} 
                  alt={comment.author} 
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <h3 className="font-medium mr-2">{comment.author}</h3>
                    <span className="text-sm text-gray-500">{comment.date}</span>
                  </div>
                  <p className="text-gray-800">{comment.content}</p>
                </div>
              </div>
              
              {/* 管理员回复 */}
              {comment.admin_reply && (
                <div className="mt-4 ml-16 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                  <div className="flex items-center mb-1">
                    <span className="font-medium text-blue-800 mr-2">管理员回复</span>
                    {comment.admin_reply_at && (
                      <span className="text-sm text-blue-600">{comment.admin_reply_at}</span>
                    )}
                  </div>
                  <p className="text-blue-900">{comment.admin_reply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 相关文章 */}
      <div>
        <h2 className="text-2xl font-bold mb-6">相关文章</h2>
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