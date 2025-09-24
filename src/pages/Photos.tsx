import { useState, useEffect, useCallback } from 'react';
import { Camera, MapPin, Calendar, Tag } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import Empty from '@/components/Empty';
import { toast } from 'sonner';

interface Photo {
  id: number;
  title: string;
  description?: string;
  image_url: string;
  thumbnail_url?: string;
  category: string;
  tags: string[];
  location?: string;
  taken_at?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

interface PhotosResponse {
  success: boolean;
  data: {
    photos: Photo[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}

interface CategoriesResponse {
  success: boolean;
  data: string[];
  message?: string;
}

export default function Photos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const limit = 20;

  // 获取照片分类
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/photos/categories');
      const data: CategoriesResponse = await response.json();
      
      if (data.success) {
        setCategories(data.data);
      } else {
        console.error('获取分类失败:', data.message);
      }
    } catch (error) {
      console.error('获取分类失败:', error);
    }
  }, []);

  // 获取照片列表
  const fetchPhotos = useCallback(async (pageNum: number = 1, reset: boolean = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: limit.toString(),
        published: 'true'
      });

      if (selectedCategory && selectedCategory !== '全部') {
        params.append('category', selectedCategory);
      }



      const response = await fetch(`/api/photos?${params}`);
      const data: PhotosResponse = await response.json();

      if (data.success) {
        const newPhotos = data.data.photos;
        
        if (reset || pageNum === 1) {
          setPhotos(newPhotos);
        } else {
          setPhotos(prev => [...prev, ...newPhotos]);
        }

        setHasMore(newPhotos.length === limit && data.data.total > pageNum * limit);
        setPage(pageNum);
      } else {
        setError(data.message || '获取照片失败');
        toast.error(data.message || '获取照片失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '网络错误';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, limit]);

  // 初始化数据
  useEffect(() => {
    fetchCategories();
    fetchPhotos(1, true);
  }, [fetchCategories, fetchPhotos]);

  // 搜索和筛选变化时重新获取数据
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPhotos(1, true);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedCategory, fetchPhotos]);

  // 加载更多
  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchPhotos(page + 1, false);
    }
  };

  // 无限滚动
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 瀑布流布局组件
  const PhotoGrid = ({ photos }: { photos: Photo[] }) => {
    return (
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="break-inside-avoid bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden group"
          >
            <div className="relative overflow-hidden">
              <img
                src={photo.thumbnail_url || photo.image_url}
                alt={photo.title}
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
            </div>
            
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                {photo.title}
              </h3>
              
              {photo.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                  {photo.description}
                </p>
              )}
              
              <div className="space-y-2">
                {photo.category && (
                  <div className="flex items-center text-xs text-gray-500">
                    <Camera className="w-3 h-3 mr-1" />
                    <span>{photo.category}</span>
                  </div>
                )}
                
                {photo.location && (
                  <div className="flex items-center text-xs text-gray-500">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span>{photo.location}</span>
                  </div>
                )}
                
                {photo.taken_at && (
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>{formatDate(photo.taken_at)}</span>
                  </div>
                )}
                
                {photo.tags && photo.tags.length > 0 && (
                  <div className="flex items-center text-xs text-gray-500">
                    <Tag className="w-3 h-3 mr-1" />
                    <div className="flex flex-wrap gap-1">
                      {photo.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 px-2 py-1 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {photo.tags.length > 3 && (
                        <span className="text-gray-400">+{photo.tags.length - 3}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">摄影作品</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            记录生活中的美好瞬间，分享摄影路上的点点滴滴
          </p>
        </div>

        {/* 分类筛选 */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>



        {/* 照片展示区域 */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <ErrorMessage message={error} onRetry={() => fetchPhotos(1, true)} />
        ) : photos.length === 0 ? (
          <Empty
            icon={Camera}
            title="暂无照片"
            description="还没有发布任何照片，请稍后再来查看"
          />
        ) : (
          <>
            <PhotoGrid photos={photos} />
            
            {/* 加载更多 */}
            {loadingMore && (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            )}
            
            {!hasMore && photos.length > 0 && (
              <div className="text-center py-8 text-gray-500">
                已显示全部照片
              </div>
            )}
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
}