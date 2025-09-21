import React from 'react';
import { apiRequest } from '@/config/api';
import { toast } from 'sonner';

interface MomentsTabProps {
  moments: any[];
  openMomentForm: (moment?: any) => void;
  deleteMoment: (id: number) => Promise<void>;
}

export default function MomentsTab({
  moments,
  openMomentForm,
  deleteMoment
}: MomentsTabProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">动态管理</h2>
        <button
          onClick={() => openMomentForm()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          ➕ 发布动态
        </button>
      </div>

      {/* 动态列表 */}
      <div className="space-y-4">
        {moments.length > 0 ? (
          moments.map(moment => (
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
                  
                  <div className="prose prose-gray max-w-none mb-3">
                    <div dangerouslySetInnerHTML={{ 
                      __html: moment.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
                        .replace(/\n/g, '<br>')
                    }} />
                  </div>
                  
                  {/* 图片展示 */}
                  {moment.images && moment.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                      {moment.images.map((image: any, index: number) => (
                        <img
                          key={index}
                          src={image}
                          className="w-full h-24 object-cover rounded-lg"
                          alt={`动态图片 ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-slate-500">
                    <span>❤️ {moment.likes_count || 0}</span>
                    <span>💬 {moment.comments_count || 0}</span>
                    <span>👁 {moment.views_count || 0}</span>
                    {moment.created_at && <span>{new Date(moment.created_at).toLocaleDateString()}</span>}
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => openMomentForm(moment)}
                    className="text-gray-400 hover:text-blue-500 transition-colors p-2"
                    title="编辑"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteMoment(moment.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2"
                    title="删除"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl p-12 shadow-sm text-center">
            <div className="text-6xl mb-4">📷</div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">还没有动态</h3>
            <p className="text-gray-600 mb-6">开始发布你的第一条动态吧！</p>
            <button
              onClick={() => openMomentForm()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              ➕ 发布动态
            </button>
          </div>
        )}
      </div>
    </div>
  );
}