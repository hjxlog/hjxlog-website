import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, MessageCircle, Calendar, Eye, ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';
import PublicNav from '@/components/PublicNav';
import { apiRequest } from '@/config/api';

interface MomentImage {
  id: number;
  image_url: string;
  thumbnail_url?: string;
  alt_text?: string;
  sort_order: number;
}

interface Moment {
  id: number;
  content: string;
  visibility: 'public' | 'private';
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
  images: MomentImage[];
}

interface Comment {
  id: number;
  moment_id: number;
  parent_id?: number;
  author_name: string;
  author_email: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface CommentForm {
  author_name: string;
  author_email: string;
  content: string;
  parent_id?: number;
}

export default function MomentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [moment, setMoment] = useState<Moment | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [commentForm, setCommentForm] = useState<CommentForm>({
    author_name: '',
    author_email: '',
    content: '',
  });
  const [submittingComment, setSubmittingComment] = useState(false);

  // 获取动态详情
  const fetchMoment = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await apiRequest(`/api/moments/${id}`);

      if (data.success) {
        setMoment(data.data);
      } else {
        toast.error(data.message || '获取动态详情失败');
        navigate('/moments');
      }
    } catch (error) {
      console.error('获取动态详情失败:', error);
      toast.error('获取动态详情失败');
      navigate('/moments');
    } finally {
      setLoading(false);
    }
  };

  // 获取评论列表
  const fetchComments = async () => {
    if (!id) return;
    
    try {
      setCommentsLoading(true);
      const data = await apiRequest(`/api/moments/${id}/comments`);

      if (data.success) {
        setComments(data.data);
      } else {
        toast.error(data.message || '获取评论失败');
      }
    } catch (error) {
      console.error('获取评论失败:', error);
      toast.error('获取评论失败');
    } finally {
      setCommentsLoading(false);
    }
  };

  // 点赞动态
  const handleLike = async () => {
    if (!id || !moment) return;
    
    try {
      const data = await apiRequest(`/api/moments/${id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (data.success) {
        setMoment(prev => prev ? { ...prev, likes_count: data.likes_count } : null);
        toast.success(data.message);
      } else {
        toast.error(data.message || '点赞失败');
      }
    } catch (error) {
      console.error('点赞失败:', error);
      toast.error('点赞失败');
    }
  };

  // 提交评论
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentForm.author_name || !commentForm.author_email || !commentForm.content) {
      toast.error('请填写完整的评论信息');
      return;
    }

    try {
      setSubmittingComment(true);
      const data = await apiRequest(`/api/moments/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentForm),
      });

      if (data.success) {
        toast.success(data.message);
        setCommentForm({ author_name: '', author_email: '', content: '' });
        // 重新获取评论列表
        fetchComments();
        // 更新动态评论数
        if (moment) {
          setMoment(prev => prev ? { ...prev, comments_count: prev.comments_count + 1 } : null);
        }
      } else {
        toast.error(data.message || '评论提交失败');
      }
    } catch (error) {
      console.error('评论提交失败:', error);
      toast.error('评论提交失败');
    } finally {
      setSubmittingComment(false);
    }
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  // 渲染动态内容（支持简单的Markdown）
  const renderContent = (content: string) => {
    let rendered = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
      .replace(/\n/g, '<br>');
    
    return <div dangerouslySetInnerHTML={{ __html: rendered }} />;
  };

  useEffect(() => {
    fetchMoment();
    fetchComments();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <PublicNav />
        <div className="pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded mb-4"></div>
              <div className="flex gap-4">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!moment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <PublicNav />
        <div className="pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">动态不存在</h1>
            <Link
              to="/moments"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="w-4 h-4" />
              返回动态列表
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <PublicNav />
      
      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* 返回按钮 */}
          <div className="mb-6">
            <Link
              to="/moments"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回动态列表
            </Link>
          </div>

          {/* 动态详情 */}
          <article className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="p-6">
              {/* 动态内容 */}
              <div className="prose prose-gray max-w-none mb-6">
                {renderContent(moment.content)}
              </div>

              {/* 图片网格 */}
              {moment.images && (
                (() => {
                  // 处理图片数据：如果是字符串则分割，如果是数组则直接使用
                  const imageUrls = typeof moment.images === 'string' 
                    ? moment.images.split(',').filter(url => url.trim()) 
                    : Array.isArray(moment.images) 
                      ? moment.images.map(img => typeof img === 'string' ? img : img.image_url || img.url).filter(Boolean)
                      : [];
                  
                  if (imageUrls.length === 0) return null;
                  
                  return (
                    <div className={`grid gap-3 mb-6 ${
                      imageUrls.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' :
                      imageUrls.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                      imageUrls.length === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
                      'grid-cols-2 sm:grid-cols-3'
                    }`}>
                      {imageUrls.map((imageUrl, index) => (
                        <div key={index} className="relative group cursor-pointer overflow-hidden rounded-lg">
                          <img
                            src={imageUrl}
                            alt={`动态图片 ${index + 1}`}
                            className={`w-full object-cover group-hover:opacity-90 transition-all duration-300 group-hover:scale-105 ${
                              imageUrls.length === 1 ? 'h-80 sm:h-96' :
                              imageUrls.length === 2 ? 'h-56 sm:h-64' :
                              'h-48 sm:h-56'
                            }`}
                            loading="lazy"
                            onClick={() => setSelectedImageIndex(index)}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                          {/* 点击放大提示 */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-black/50 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                              点击放大
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}

              {/* 动态信息栏 */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <button
                    onClick={handleLike}
                    className="flex items-center gap-1 hover:text-red-600 transition-colors group"
                  >
                    <Heart className="w-4 h-4 group-hover:fill-current" />
                    <span>{moment.likes_count}</span>
                  </button>
                  
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{moment.comments_count}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{moment.views_count}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <time dateTime={moment.created_at}>
                    {formatTime(moment.created_at)}
                  </time>
                </div>
              </div>
            </div>
          </article>

          {/* 评论区 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">评论 ({comments.length})</h3>
              
              {/* 评论表单 */}
              <form onSubmit={handleSubmitComment} className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="您的姓名"
                    value={commentForm.author_name}
                    onChange={(e) => setCommentForm(prev => ({ ...prev, author_name: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <input
                    type="email"
                    placeholder="您的邮箱"
                    value={commentForm.author_email}
                    onChange={(e) => setCommentForm(prev => ({ ...prev, author_email: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <textarea
                  placeholder="写下您的评论..."
                  value={commentForm.content}
                  onChange={(e) => setCommentForm(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                  required
                />
                <div className="flex justify-end mt-4">
                  <button
                    type="submit"
                    disabled={submittingComment}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    {submittingComment ? '提交中...' : '发表评论'}
                  </button>
                </div>
              </form>

              {/* 评论列表 */}
              {commentsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  暂无评论，快来发表第一条评论吧！
                </div>
              ) : (
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">{comment.author_name}</span>
                        <span className="text-sm text-gray-500">{formatTime(comment.created_at)}</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 图片预览模态框 */}
      {selectedImageIndex !== null && moment.images && (
        (() => {
          const imageUrls = typeof moment.images === 'string' 
            ? moment.images.split(',').filter(url => url.trim()) 
            : Array.isArray(moment.images) 
              ? moment.images.map(img => typeof img === 'string' ? img : img.image_url || img.url).filter(Boolean)
              : [];
          
          if (selectedImageIndex >= imageUrls.length) return null;
          
          return (
            <div 
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedImageIndex(null)}
            >
              <div className="relative max-w-[95vw] max-h-[95vh] flex flex-col">
                {/* 图片 */}
                <div className="flex-1 flex items-center justify-center">
                  <img
                    src={imageUrls[selectedImageIndex]}
                    alt={`动态图片 ${selectedImageIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                
                {/* 控制按钮 */}
                <div className="absolute top-4 right-4 flex gap-2">
                  {imageUrls.length > 1 && (
                    <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {selectedImageIndex + 1} / {imageUrls.length}
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedImageIndex(null)}
                    className="text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* 导航按钮 */}
                {imageUrls.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : imageUrls.length - 1);
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-3 hover:bg-black/70 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex(selectedImageIndex < imageUrls.length - 1 ? selectedImageIndex + 1 : 0);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-3 hover:bg-black/70 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}