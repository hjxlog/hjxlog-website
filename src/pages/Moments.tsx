import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Calendar, Plus, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import PublicNav from '../components/PublicNav';
import { apiRequest } from '@/config/api';

interface MomentImage {
  id: number;
  image_url: string;
  thumbnail_url?: string;
  alt_text?: string;
  sort_order: number;
}

interface Comment {
  id: number;
  moment_id: number;
  parent_id?: number;
  author_name: string;
  author_email: string;
  content: string;
  status: string;
  ip_address?: string;
  user_agent?: string;
  admin_reply?: string;
  admin_reply_at?: string;
  created_at: string;
  updated_at: string;
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
  comments?: Comment[];
}

interface MomentsResponse {
  success: boolean;
  data: {
    moments: Moment[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}

export default function Moments() {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [showCommentForm, setShowCommentForm] = useState<Set<number>>(new Set());
  const [commentTexts, setCommentTexts] = useState<Record<number, string>>({});
  const [commentNames, setCommentNames] = useState<Record<number, string>>({});
  const [commentEmails, setCommentEmails] = useState<Record<number, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Set<number>>(new Set());
  const [adminReplies, setAdminReplies] = useState<Record<number, string>>({});
  const [submittingReply, setSubmittingReply] = useState<Set<number>>(new Set());
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedMomentImages, setSelectedMomentImages] = useState<string[]>([]);
  const { isAuthenticated } = useContext(AuthContext);
  const limit = 10;

  // 获取动态列表
  const fetchMoments = async (pageNum: number = 1, append: boolean = false) => {
    try {
      setLoading(true);
      const data: MomentsResponse = await apiRequest(`/api/moments?page=${pageNum}&limit=${limit}&sort=created_at`);

      if (data.success) {
        if (append) {
          setMoments(prev => [...prev, ...data.data.moments]);
        } else {
          setMoments(data.data.moments);
        }
        setTotal(data.data.total);
        setHasMore(data.data.moments.length === limit);
      } else {
        toast.error(data.message || '获取动态列表失败');
      }
    } catch (error) {
      console.error('获取动态列表失败:', error);
      toast.error('获取动态列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载更多
  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMoments(nextPage, true);
    }
  };

  // 点赞动态
  const handleLike = async (momentId: number) => {
    try {
      const data = await apiRequest(`/api/moments/${momentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (data.success) {
        setMoments(prev => prev.map(moment => 
          moment.id === momentId 
            ? { ...moment, likes_count: data.likes_count }
            : moment
        ));
        toast.success(data.message);
      } else {
        toast.error(data.message || '点赞失败');
      }
    } catch (error) {
      console.error('点赞失败:', error);
      toast.error('点赞失败');
    }
  };

  // 获取评论列表
  const fetchComments = async (momentId: number) => {
    try {
      const data = await apiRequest(`/api/moments/${momentId}/comments`);
      
      if (data.success) {
        setMoments(prev => prev.map(moment => 
          moment.id === momentId 
            ? { ...moment, comments: data.data }
            : moment
        ));
      }
    } catch (error) {
      console.error('获取评论失败:', error);
    }
  };

  // 切换评论显示
  const toggleComments = async (momentId: number) => {
    const newShowCommentForm = new Set(showCommentForm);
    
    if (newShowCommentForm.has(momentId)) {
      newShowCommentForm.delete(momentId);
    } else {
      newShowCommentForm.add(momentId);
      // 如果还没有加载评论，则加载评论
      const moment = moments.find(m => m.id === momentId);
      if (!moment?.comments) {
        await fetchComments(momentId);
      }
    }
    
    setShowCommentForm(newShowCommentForm);
  };

  // 切换评论展开/收起
  const toggleExpandComments = (momentId: number) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(momentId)) {
      newExpanded.delete(momentId);
    } else {
      newExpanded.add(momentId);
    }
    setExpandedComments(newExpanded);
  };

  // 提交评论
  const handleSubmitComment = async (momentId: number) => {
    const content = commentTexts[momentId]?.trim();
    const author_name = commentNames[momentId]?.trim();
    const author_email = commentEmails[momentId]?.trim();
    
    if (!content) {
      toast.error('请输入评论内容');
      return;
    }
    
    if (!author_name) {
      toast.error('请输入您的姓名');
      return;
    }

    const newSubmitting = new Set(submittingComment);
    newSubmitting.add(momentId);
    setSubmittingComment(newSubmitting);

    try {
      const data = await apiRequest(`/api/moments/${momentId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content, 
          author_name,
          author_email: author_email || ''
        }),
      });

      if (data.success) {
        // 清空评论输入框
        setCommentTexts(prev => ({ ...prev, [momentId]: '' }));
        setCommentNames(prev => ({ ...prev, [momentId]: '' }));
        setCommentEmails(prev => ({ ...prev, [momentId]: '' }));
        // 重新获取评论列表
        await fetchComments(momentId);
        // 更新评论数量
        setMoments(prev => prev.map(moment => 
          moment.id === momentId 
            ? { ...moment, comments_count: moment.comments_count + 1 }
            : moment
        ));
        toast.success('评论发布成功');
      } else {
        toast.error(data.message || '评论发布失败');
      }
    } catch (error) {
      console.error('评论发布失败:', error);
      toast.error('评论发布失败');
    } finally {
      const newSubmitting = new Set(submittingComment);
      newSubmitting.delete(momentId);
      setSubmittingComment(newSubmitting);
    }
  };

  // 提交管理员回复
  const handleSubmitReply = async (commentId: number) => {
    const admin_reply = adminReplies[commentId]?.trim();
    
    if (!admin_reply) {
      toast.error('请输入回复内容');
      return;
    }

    const newSubmitting = new Set(submittingReply);
    newSubmitting.add(commentId);
    setSubmittingReply(newSubmitting);

    try {
      const data = await apiRequest(`/api/moments/comments/${commentId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ admin_reply }),
      });

      if (data.success) {
        // 清空回复输入框
        setAdminReplies(prev => ({ ...prev, [commentId]: '' }));
        // 重新获取评论列表
        const momentId = data.data.moment_id;
        await fetchComments(momentId);
        toast.success('回复成功');
      } else {
        toast.error(data.message || '回复失败');
      }
    } catch (error) {
      console.error('回复失败:', error);
      toast.error('回复失败');
    } finally {
      const newSubmitting = new Set(submittingReply);
      newSubmitting.delete(commentId);
      setSubmittingReply(newSubmitting);
    }
  };

  // 更新评论文本
  const updateCommentText = (momentId: number, text: string) => {
    setCommentTexts(prev => ({ ...prev, [momentId]: text }));
  };

  // 更新评论姓名
  const updateCommentName = (momentId: number, name: string) => {
    setCommentNames(prev => ({ ...prev, [momentId]: name }));
  };

  // 更新评论邮箱
  const updateCommentEmail = (momentId: number, email: string) => {
    setCommentEmails(prev => ({ ...prev, [momentId]: email }));
  };

  // 更新管理员回复内容
  const updateAdminReply = (commentId: number, content: string) => {
    setAdminReplies(prev => ({ ...prev, [commentId]: content }));
  };

  // 处理图片点击放大
  const handleImageClick = (imageUrls: string[], index: number) => {
    setSelectedMomentImages(imageUrls);
    setSelectedImageIndex(index);
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
    // 简单的Markdown渲染：链接、粗体、斜体
    let rendered = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
      .replace(/\n/g, '<br>');
    
    return <div dangerouslySetInnerHTML={{ __html: rendered }} />;
  };

  useEffect(() => {
    fetchMoments();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <PublicNav />
      
      {/* 动态列表 */}
      <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
        {loading && moments.length === 0 ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-32 bg-gray-200 rounded mb-4"></div>
                <div className="flex gap-4">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : moments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无动态</h3>
            <p className="text-gray-600 mb-6">还没有人发布动态，快来发布第一条吧！</p>
            {isAuthenticated && (
              <Link
                to="/moments/create"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                发布动态
              </Link>
            )}
          </div>
        ) : (
          <div className="relative">
            {/* 时间轴线 */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 via-purple-400 to-pink-400"></div>
            
            <div className="space-y-8">
              {moments.map((moment, index) => (
                <div key={moment.id} className="relative flex items-start">
                  {/* 时间节点 */}
                  <div className="absolute left-6 w-4 h-4 bg-white border-4 border-blue-400 rounded-full shadow-lg z-10"></div>
                  
                  {/* 内容卡片 */}
                  <div className="ml-16 flex-1">
                    <article className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                      {/* 时间标签 */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <time dateTime={moment.created_at} className="font-medium">
                            {formatTime(moment.created_at)}
                          </time>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        {/* 动态内容 */}
                        <div className="prose prose-gray max-w-none mb-4">
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
                              <div className={`grid gap-2 mb-4 ${
                                imageUrls.length === 1 ? 'grid-cols-1 max-w-md' :
                                imageUrls.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                                imageUrls.length === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
                                'grid-cols-2 sm:grid-cols-3'
                              }`}>
                                {imageUrls.map((imageUrl, index) => (
                                   <div key={index} className="relative group cursor-pointer overflow-hidden rounded-lg" onClick={() => handleImageClick(imageUrls, index)}>
                                     <img
                                       src={imageUrl}
                                       alt={`动态图片 ${index + 1}`}
                                       className={`w-full object-cover group-hover:opacity-90 transition-all duration-300 group-hover:scale-105 ${
                                         imageUrls.length === 1 ? 'h-64 sm:h-80' :
                                         imageUrls.length === 2 ? 'h-48 sm:h-56' :
                                         'h-40 sm:h-48'
                                       }`}
                                       loading="lazy"
                                     />
                                     <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                     {/* 移动端点击提示 */}
                                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity sm:hidden">
                                       <div className="bg-black/50 text-white px-2 py-1 rounded text-xs">
                                         点击查看大图
                                       </div>
                                     </div>
                                   </div>
                                 ))}
                              </div>
                            );
                          })()
                        )}

                        {/* 动态信息栏 */}
                        <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                          <button
                            onClick={() => handleLike(moment.id)}
                            className="flex items-center gap-1 hover:text-red-600 transition-colors group text-sm text-gray-600"
                          >
                            <Heart className="w-4 h-4 group-hover:fill-current" />
                            <span>{moment.likes_count}</span>
                          </button>
                          
                          <button
                            onClick={() => toggleComments(moment.id)}
                            className="flex items-center gap-1 hover:text-blue-600 transition-colors text-sm text-gray-600"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>{moment.comments_count}</span>
                          </button>
                        </div>

                        {/* 评论区域 */}
                        {showCommentForm.has(moment.id) && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            {/* 评论列表 */}
                            {moment.comments && moment.comments.length > 0 && (
                              <div className="mb-4">
                                <div className="space-y-3">
                                  {(expandedComments.has(moment.id) ? moment.comments : moment.comments.slice(0, 3)).map((comment) => (
                                    <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <p className="text-sm text-gray-800 mb-1">{comment.content}</p>
                                          <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>{comment.author_name}</span>
                                            <span>•</span>
                                            <time>{formatTime(comment.created_at)}</time>
                                          </div>
                                          
                                          {/* 管理员回复 */}
                                          {comment.admin_reply && (
                                            <div className="mt-2 p-2 bg-blue-50 border-l-2 border-blue-400 rounded">
                                              <p className="text-sm text-gray-800 mb-1">{comment.admin_reply}</p>
                                              <div className="flex items-center gap-2 text-xs text-blue-600">
                                                <span className="font-medium">管理员回复</span>
                                                <span>•</span>
                                                <time>{comment.admin_reply_at ? formatTime(comment.admin_reply_at) : ''}</time>
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* 管理员回复输入框 */}
                                          {isAuthenticated && !comment.admin_reply && (
                                            <div className="mt-2">
                                              <div className="flex gap-2">
                                                <input
                                                  type="text"
                                                  value={adminReplies[comment.id] || ''}
                                                  onChange={(e) => updateAdminReply(comment.id, e.target.value)}
                                                  placeholder="管理员回复..."
                                                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                />
                                                <button
                                                  onClick={() => handleSubmitReply(comment.id)}
                                                  disabled={submittingReply.has(comment.id) || !adminReplies[comment.id]?.trim()}
                                                  className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                  {submittingReply.has(comment.id) ? '回复中...' : '回复'}
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                
                                {/* 展开/收起按钮 */}
                                {moment.comments.length > 3 && (
                                  <button
                                    onClick={() => toggleExpandComments(moment.id)}
                                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-3 transition-colors"
                                  >
                                    {expandedComments.has(moment.id) ? (
                                      <>
                                        <ChevronUp className="w-4 h-4" />
                                        <span>收起评论</span>
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-4 h-4" />
                                        <span>展开更多 ({moment.comments.length - 3} 条)</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            )}
                            
                            {/* 评论输入框 */}
                            <div className="space-y-3">
                              {/* 用户信息输入 */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  value={commentNames[moment.id] || ''}
                                  onChange={(e) => updateCommentName(moment.id, e.target.value)}
                                  placeholder="您的姓名 *"
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                  required
                                />
                                <input
                                  type="email"
                                  value={commentEmails[moment.id] || ''}
                                  onChange={(e) => updateCommentEmail(moment.id, e.target.value)}
                                  placeholder="您的邮箱（可选）"
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                              </div>
                              
                              {/* 评论内容输入 */}
                              <div className="flex gap-3">
                                <div className="flex-1">
                                  <textarea
                                    value={commentTexts[moment.id] || ''}
                                    onChange={(e) => updateCommentText(moment.id, e.target.value)}
                                    placeholder="写下你的评论..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    rows={2}
                                  />
                                </div>
                                <button
                                  onClick={() => handleSubmitComment(moment.id)}
                                  disabled={submittingComment.has(moment.id) || !commentTexts[moment.id]?.trim() || !commentNames[moment.id]?.trim()}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm h-fit"
                                >
                                  <Send className="w-4 h-4" />
                                  {submittingComment.has(moment.id) ? '发送中...' : '发送'}
                                </button>
                              </div>
                              
                              <p className="text-xs text-gray-500">
                                * 必填项。您的评论将会被公开显示。
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  </div>
                </div>
              ))}
            </div>

            {/* 加载更多按钮 */}
            {hasMore && (
              <div className="text-center py-8">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '加载中...' : '加载更多'}
                </button>
              </div>
            )}

            {!hasMore && moments.length > 0 && (
              <div className="text-center py-8 text-gray-500">
                已显示全部 {total} 条动态
              </div>
            )}
          </div>
        )}
      </div>

      {/* 图片预览模态框 */}
      {selectedImageIndex !== null && selectedMomentImages.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImageIndex(null)}
        >
          <div className="relative max-w-[95vw] max-h-[95vh] flex flex-col">
            {/* 图片 */}
            <div className="flex-1 flex items-center justify-center">
              <img
                src={selectedMomentImages[selectedImageIndex]}
                alt={`动态图片 ${selectedImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            {/* 控制按钮 */}
            <div className="absolute top-4 right-4 flex gap-2">
              {selectedMomentImages.length > 1 && (
                <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {selectedImageIndex + 1} / {selectedMomentImages.length}
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
            {selectedMomentImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : selectedMomentImages.length - 1);
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
                    setSelectedImageIndex(selectedImageIndex < selectedMomentImages.length - 1 ? selectedImageIndex + 1 : 0);
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
      )}
    </div>
  );
}