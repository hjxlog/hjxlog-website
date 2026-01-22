import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Eye, ArrowLeft } from 'lucide-react';
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
  views_count: number;
  created_at: string;
  updated_at: string;
  images: MomentImage[];
}

export default function MomentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [moment, setMoment] = useState<Moment | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

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
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-2" />')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline underline-offset-4">$1</a>')
      .replace(/\n/g, '<br>');
    
    return <div dangerouslySetInnerHTML={{ __html: rendered }} />;
  };

  useEffect(() => {
    fetchMoment();
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
                  const imagesData = moment.images as any;
                  const imageUrls = typeof imagesData === 'string' 
                    ? imagesData.split(',').filter((url: string) => url.trim()) 
                    : Array.isArray(imagesData) 
                      ? imagesData.map((img: any) => typeof img === 'string' ? img : img.image_url || img.url).filter(Boolean)
                      : [];
                  
                  if (imageUrls.length === 0) return null;
                  
                  return (
                    <div className={`grid gap-3 mb-6 ${
                      imageUrls.length === 1 ? 'grid-cols-1 max-w-2xl' :
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
        </div>
      </div>

      {/* 图片预览模态框 */}
      {selectedImageIndex !== null && moment.images && (
        (() => {
          const imagesData = moment.images as any;
          const imageUrls = typeof imagesData === 'string' 
            ? imagesData.split(',').filter((url: string) => url.trim()) 
            : Array.isArray(imagesData) 
              ? imagesData.map((img: any) => typeof img === 'string' ? img : img.image_url || img.url).filter(Boolean)
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
                    loading="lazy"
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
