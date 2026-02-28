import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Eye, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import PublicNav from '@/components/PublicNav';
import { apiRequest } from '@/config/api';
import { useViewTracker } from '@/hooks/useViewTracker';

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
  views: number;
  created_at: string;
  updated_at: string;
  images: MomentImage[];
}

export default function MomentDetail() {
  const { id } = useParams<{ id: string }>();
  useViewTracker('moment', Number(id), !!id);

  const navigate = useNavigate();
  const [moment, setMoment] = useState<Moment | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

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
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="!inline-block !my-1 max-h-[500px] w-auto rounded-lg border border-gray-100 object-cover cursor-zoom-in" loading="lazy" />')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline underline-offset-4">$1</a>')
      .replace(/\n/g, '<br>');
    
    return <div dangerouslySetInnerHTML={{ __html: rendered }} onClick={(e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        const img = target as HTMLImageElement;
        setSelectedImageUrl(img.src);
      }
    }} />;
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

              {/* 动态信息栏 */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{moment.views}</span>
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
      {selectedImageUrl && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImageUrl(null)}
        >
          <div className="relative max-w-[95vw] max-h-[95vh] flex flex-col items-center justify-center">
            <img
              src={selectedImageUrl}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            
            <button
              onClick={() => setSelectedImageUrl(null)}
              className="absolute top-4 right-4 text-white bg-white/10 backdrop-blur-md rounded-full p-2 hover:bg-white/20 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
