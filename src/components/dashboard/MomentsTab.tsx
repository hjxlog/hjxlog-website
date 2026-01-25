import React, { useMemo } from 'react';
import { Moment } from '@/types';

type DashboardMoment = Moment & {
  views?: number;
};

interface MomentsTabProps {
  moments: DashboardMoment[];
  openMomentForm: (moment?: DashboardMoment) => void;
  deleteMoment: (id: number) => Promise<void>;
}

const extractImagesAndText = (content: string) => {
  const images: { url: string; alt: string }[] = [];
  const text = content
    .replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, url) => {
      images.push({ url, alt });
      return '';
    })
    .trim();
  return { text, images };
};

const renderTextHtml = (text: string) => (
  text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
    .replace(/\n/g, '<br>')
);

const ImageGrid = ({ images }: { images: { url: string; alt: string }[] }) => {
  if (images.length === 0) return null;

  // 单张图片
  if (images.length === 1) {
    return (
      <div className="mt-3">
        <img
          src={images[0].url}
          alt={images[0].alt}
          className="max-h-[300px] max-w-full rounded-lg border border-gray-100 object-cover"
          onClick={() => window.open(images[0].url, '_blank')}
          style={{ cursor: 'zoom-in' }}
        />
      </div>
    );
  }

  // 2张或4张图片使用2列布局
  const isTwoColumns = images.length === 2 || images.length === 4;
  const gridClass = isTwoColumns 
    ? 'grid-cols-2 max-w-[80%] sm:max-w-[60%]' // 限制宽度以保持图片尺寸适中
    : 'grid-cols-3'; // 3张及其他数量使用3列布局

  return (
    <div className={`grid gap-2 mt-3 ${gridClass}`}>
      {images.map((img, index) => (
        <div 
          key={index} 
          className="relative aspect-square overflow-hidden rounded-lg cursor-zoom-in bg-gray-100"
          onClick={() => window.open(img.url, '_blank')}
        >
          <img 
            src={img.url} 
            alt={img.alt} 
            className="w-full h-full object-cover hover:opacity-90 transition-opacity" 
          />
        </div>
      ))}
    </div>
  );
};

export default function MomentsTab({
  moments,
  openMomentForm,
  deleteMoment
}: MomentsTabProps) {
  const momentCards = useMemo(() => (
    moments.map((moment) => {
      const { text, images } = extractImagesAndText(moment.content || '');
      return {
        ...moment,
        images,
        textHtml: text ? renderTextHtml(text) : '',
        dateLabel: moment.created_at ? new Date(moment.created_at).toLocaleDateString() : '',
      };
    })
  ), [moments]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">动态管理</h2>
        <div className="flex gap-3">
          <button
            onClick={() => openMomentForm()}
            className="px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-[#165DFF]/90 transition-colors flex items-center"
          >
            <i className="fas fa-plus mr-2"></i> 发布动态
          </button>
        </div>
      </div>

      {/* 动态列表 */}
      <div className="space-y-4">
        {moments.length > 0 ? (
          momentCards.map(moment => {
            return (
              <div key={moment.id} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        moment.visibility === 'public' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {moment.visibility === 'public' ? '公开' : '私密'}
                      </span>
                    </div>
                    
                    {moment.textHtml && (
                      <div className="prose prose-gray max-w-none mb-3">
                        <div dangerouslySetInnerHTML={{ 
                          __html: moment.textHtml
                        }} />
                      </div>
                    )}

                    <ImageGrid images={moment.images} />
                    
                    <div className="flex items-center space-x-4 text-sm text-slate-500 mt-3">
                      <span><i className="fas fa-eye mr-1"></i> {moment.views || 0}</span>
                      {moment.dateLabel && <span>{moment.dateLabel}</span>}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => openMomentForm(moment)}
                      className="text-gray-400 hover:text-blue-500 transition-colors p-2"
                      title="编辑"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => deleteMoment(moment.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-2"
                      title="删除"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl p-12 shadow-sm text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-camera text-4xl text-blue-500"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">还没有动态</h3>
            <p className="text-gray-600 mb-6">开始发布你的第一条动态吧！</p>
            <button
              onClick={() => openMomentForm()}
              className="px-6 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-[#165DFF]/90 transition-colors flex items-center justify-center mx-auto"
            >
              <i className="fas fa-plus mr-2"></i> 发布动态
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
