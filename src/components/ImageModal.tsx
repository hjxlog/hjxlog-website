import { useState, useEffect, useCallback, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Photo {
  id: number;
  title: string;
  description?: string;
  image_url: string;
  thumbnail_url?: string;
  category: string;
  location?: string;
  taken_at?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: Photo[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}

export default function ImageModal({ isOpen, onClose, photos, currentIndex, onNavigate }: ImageModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const currentPhoto = photos[currentIndex];

  const takenAtLabel = useMemo(() => {
    if (!currentPhoto?.taken_at) return '';
    return new Date(currentPhoto.taken_at).toLocaleDateString('zh-CN');
  }, [currentPhoto?.taken_at]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (currentIndex > 0) {
            onNavigate(currentIndex - 1);
          }
          break;
        case 'ArrowRight':
          if (currentIndex < photos.length - 1) {
            onNavigate(currentIndex + 1);
          }
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, currentIndex, photos.length, onClose, onNavigate]);

  // 重置图片加载状态
  useEffect(() => {
    setImageLoaded(false);
  }, [currentIndex]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  }, [currentIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      onNavigate(currentIndex + 1);
    }
  }, [currentIndex, onNavigate, photos.length]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen || !currentPhoto) return null;

  return (
    <div 
      className="fixed inset-0 z-[10000] bg-black bg-opacity-90 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200"
        aria-label="关闭"
      >
        <X className="w-6 h-6" />
      </button>

      {/* 左箭头 */}
      {currentIndex > 0 && (
        <button
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200"
          aria-label="上一张"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* 右箭头 */}
      {currentIndex < photos.length - 1 && (
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200"
          aria-label="下一张"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* 图片容器 */}
      <div className="relative max-w-full max-h-full flex flex-col items-center">
        {/* 加载指示器 */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* 主图片 */}
        <img
          src={currentPhoto.image_url}
          alt={currentPhoto.title}
          className={`max-w-full max-h-[80vh] object-contain transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />

        {/* 图片信息 */}
        <div className="mt-4 text-center text-white max-w-2xl">
          <h3 className="text-xl font-semibold mb-2">{currentPhoto.title}</h3>
          {currentPhoto.description && (
            <p className="text-gray-300 text-sm mb-2">{currentPhoto.description}</p>
          )}
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            {currentPhoto.location && (
              <span>地点: {currentPhoto.location}</span>
            )}
            {takenAtLabel && (
              <span>拍摄时间: {takenAtLabel}</span>
            )}
          </div>
        </div>

        {/* 图片计数 */}
        <div className="mt-2 text-gray-400 text-sm">
          {currentIndex + 1} / {photos.length}
        </div>
      </div>
    </div>
  );
}
