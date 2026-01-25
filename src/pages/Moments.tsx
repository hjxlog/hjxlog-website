import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, Image as ImageIcon, MessageCircle, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import PublicNav from '../components/PublicNav';
import Footer from '@/components/Footer';
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
  images: string[];
  author_id: number;
  visibility: 'public' | 'private';
  created_at: string;
  updated_at: string;
  views?: number;
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
  const [hasMore, setHasMore] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedMomentImages, setSelectedMomentImages] = useState<string[]>([]);
  const limit = 10;

  // 浏览追踪逻辑
  const observer = useRef<IntersectionObserver | null>(null);
  const viewedIds = useRef<Set<number>>(new Set()); // 会话级去重
  const pendingIds = useRef<Set<number>>(new Set()); // 待上报队列
  const reportTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // 上报浏览记录
  const reportViews = async () => {
    if (pendingIds.current.size === 0) return;

    const idsToReport = Array.from(pendingIds.current);
    pendingIds.current.clear();

    try {
      // 使用新的统一接口
      const items = idsToReport.map(id => ({
        type: 'moment',
        id,
        path: window.location.pathname
      }));

      const res = await apiRequest('/api/view/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      
      // 更新本地视图计数 (使用后端返回的最新数据)
      if (res.success && Array.isArray(res.data)) {
        const updatedViewsMap = new Map(res.data.map((item: any) => [item.id, item.views]));
        
        setMoments(prev => prev.map(m => {
          if (updatedViewsMap.has(m.id)) {
            return { ...m, views: Number(updatedViewsMap.get(m.id)) };
          }
          return m;
        }));
      }
    } catch (error) {
      console.error('上报浏览记录失败:', error);
    }
  };

  // 初始化观察器
  useEffect(() => {
    observer.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = Number(entry.target.getAttribute('data-moment-id'));
          if (id && !viewedIds.current.has(id)) {
            // 标记为已看
            viewedIds.current.add(id);
            pendingIds.current.add(id);
          }
        }
      });
    }, {
      threshold: 0.3, // 30% 可见时触发
      rootMargin: '0px' 
    });

    // 定时上报
    reportTimer.current = setInterval(reportViews, 3000); // 每3秒上报一次

    return () => {
      if (observer.current) observer.current.disconnect();
      if (reportTimer.current) clearInterval(reportTimer.current);
      reportViews(); // 卸载前最后一次上报
    };
  }, []);

  // 监听列表变化，绑定新元素
  useEffect(() => {
    if (!observer.current) return;
    
    // 简单的做法：每次列表更新重新观察所有（Observer会自动去重吗？connect会重复吗？
    // observe 同一个 element 多次没事，但为了性能，最好只 observe 新的。
    // 这里简单处理：disconnect all and re-observe all，对于无限滚动来说开销尚可接受。
    observer.current.disconnect();
    
    // 延迟一点确保DOM已渲染
    setTimeout(() => {
      const cards = document.querySelectorAll('.moment-card');
      cards.forEach(card => observer.current?.observe(card));
    }, 100);
    
  }, [moments]);

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

  // 处理图片点击放大
  const handleImageClick = (imageUrls: string[], index: number) => {
    setSelectedMomentImages(imageUrls);
    setSelectedImageIndex(index);
  };



  // 格式化精确时间 (HH:mm)
  const formatExactTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // 渲染动态内容（支持简单的Markdown）
  const renderContent = (content: string) => {
    // 简单的Markdown渲染：链接、粗体、斜体、图片
    let rendered = content
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="!inline-block !my-1 max-h-[500px] w-auto rounded-lg border border-gray-100 object-cover cursor-zoom-in" loading="lazy" />')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline underline-offset-4">$1</a>')
      .replace(/\n/g, '<br>');
    
    return <div dangerouslySetInnerHTML={{ __html: rendered }} onClick={(e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        const img = target as HTMLImageElement;
        handleImageClick([img.src], 0);
      }
    }} />;
  };

  const getTimelineDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    return { month, day, year };
  };

  useEffect(() => {
    fetchMoments();
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f7] relative flex flex-col">
      {/* 顶部白色渐变背景，确保导航栏区域视觉与首页一致 */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-white via-white/50 to-[#f5f5f7] z-0 pointer-events-none" />

      <PublicNav />
      
      <main className="container mx-auto px-6 pt-24 pb-24 max-w-4xl relative z-10 flex-1 w-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 pl-0 md:pl-[120px]">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">生活动态</h1>
            <p className="text-slate-500 font-medium max-w-md">
              记录生活中的点滴与灵感，分享每一个值得纪念的瞬间。
            </p>
          </motion.div>
        </div>

        {/* Timeline Container */}
        <div className="relative">
          {/* Vertical Timeline Line */}
          <div className="hidden md:block absolute left-[104px] top-0 bottom-0 w-px bg-slate-200" />

          {/* Moments List */}
          <div className="space-y-8">
            {loading && moments.length === 0 ? (
              // Loading Skeleton (Timeline Style)
              <div className="space-y-12">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex flex-col md:flex-row gap-4 md:gap-12">
                    <div className="w-full md:w-[80px] flex md:flex-col items-center md:items-end gap-3 md:gap-0 md:text-right pt-0 md:pt-2">
                      <div className="h-5 w-12 bg-slate-200 rounded" />
                      <div className="h-4 w-8 bg-slate-100 rounded md:mt-1" />
                    </div>
                    <div className="relative flex-1">
                      <div className="hidden md:block absolute -left-8 top-3 w-4 h-4 rounded-full bg-slate-100 border-4 border-[#f5f5f7]" />
                      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200/60 h-64" />
                    </div>
                  </div>
                ))}
              </div>
            ) : moments.length === 0 ? (
              <div className="text-center py-32 pl-0 md:pl-[100px]">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">暂无动态</h3>
                <p className="text-slate-500 mb-6">还没有人发布动态，快来发布第一条吧！</p>
              </div>
            ) : (
              <AnimatePresence mode='popLayout'>
                {moments.map((moment, index) => {
                  const { month, day, year } = getTimelineDate(moment.created_at);
                  const isNewYear = index === 0 || new Date(moments[index - 1].created_at).getFullYear() !== year;

                  return (
                    <motion.div
                      key={moment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative group ${isNewYear && index !== 0 ? 'md:mt-16' : ''} moment-card`}
                      data-moment-id={moment.id}
                    >
                      {/* Year Marker */}
                      {isNewYear && (
                        <div className="md:absolute md:-left-[20px] md:-top-12 flex items-center justify-center w-24 h-8 bg-slate-900 text-white text-sm font-bold rounded-full z-10 shadow-lg shadow-slate-900/10 mb-6 md:mb-0">
                          {year}
                        </div>
                      )}

                      <div className="flex flex-col md:flex-row gap-4 md:gap-12">
                        {/* Timeline Date (Left) */}
                        <div className="w-full md:w-[80px] flex md:flex-col items-center md:items-end gap-3 md:gap-0 md:text-right pt-0 md:pt-1 flex-shrink-0">
                          <div className="text-2xl font-bold text-slate-900 leading-none">{day}</div>
                          <div className="text-sm font-medium text-slate-400 uppercase tracking-wide">{month}</div>
                          <div className="text-xs font-medium text-slate-300 mt-1 hidden md:block">{formatExactTime(moment.created_at)}</div>
                          {/* 移动端显示的年份和分隔符 */}
                          <div className="md:hidden text-sm font-medium text-slate-300">/</div>
                          <div className="md:hidden text-sm font-bold text-slate-500">{year}</div>
                          <div className="md:hidden text-xs font-medium text-slate-300 ml-2">{formatExactTime(moment.created_at)}</div>
                        </div>

                        {/* Timeline Node & Content (Right) */}
                        <div className="relative flex-1 pb-4">
                          {/* Node */}
                          <div className="hidden md:block absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full bg-white border-[3px] border-slate-300 group-hover:border-[#165DFF] group-hover:scale-110 transition-all duration-300 z-10 shadow-sm" />
                          
                          {/* Content Card */}
                          <article className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden hover:shadow-md transition-all duration-300 group-hover:border-slate-300">
                            <div className="p-8">
                              {/* Content */}
                              <div className="prose prose-slate max-w-none mb-4">
                                {renderContent(moment.content)}
                              </div>

                              {/* Action Bar / Meta Info */}
                              <div className="mt-4 flex justify-end items-center">
                                {moment.visibility === 'private' && (
                                  <span className="px-1.5 py-0.5 bg-slate-100 rounded text-xs text-slate-500">仅自己可见</span>
                                )}
                              </div>


                            </div>
                          </article>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="text-center py-12 pl-0 md:pl-[100px]">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-full font-medium hover:bg-slate-50 hover:text-[#165DFF] hover:border-blue-100 transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? '正在加载...' : '加载更多动态'}
            </button>
          </div>
        )}

        {!hasMore && moments.length > 0 && (
          <div className="text-center py-12 text-slate-400 text-sm font-medium pl-0 md:pl-[100px]">
            —— 已经到底啦 ——
          </div>
        )}
      </main>

      <Footer />

      {/* Image Preview Modal */}
      <AnimatePresence>
        {selectedImageIndex !== null && selectedMomentImages.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setSelectedImageIndex(null)}
          >
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              {/* Image */}
              <motion.img
                key={selectedImageIndex}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={selectedMomentImages[selectedImageIndex]}
                alt={`Preview ${selectedImageIndex + 1}`}
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
              
              {/* Controls */}
              <div className="absolute top-4 right-4 flex gap-4">
                {selectedMomentImages.length > 1 && (
                  <div className="bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium border border-white/10">
                    {selectedImageIndex + 1} / {selectedMomentImages.length}
                  </div>
                )}
                <button
                  onClick={() => setSelectedImageIndex(null)}
                  className="bg-white/10 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/20 transition-colors border border-white/10"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Navigation Arrows */}
              {selectedMomentImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : selectedMomentImages.length - 1);
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md text-white p-3 rounded-full hover:bg-white/20 transition-colors border border-white/10"
                  >
                    <ChevronDown className="w-6 h-6 rotate-90" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(selectedImageIndex < selectedMomentImages.length - 1 ? selectedImageIndex + 1 : 0);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md text-white p-3 rounded-full hover:bg-white/20 transition-colors border border-white/10"
                  >
                    <ChevronDown className="w-6 h-6 -rotate-90" />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
