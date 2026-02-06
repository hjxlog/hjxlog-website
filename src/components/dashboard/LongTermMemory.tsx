import React, { useState } from 'react';
import { SparklesIcon, ArrowPathIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface LongTermMemoryItem {
  id: number;
  title: string;
  content: string;
  source_date?: string;
  category: string;
  importance: number;
  tags: string[];
  created_at: string;
}

interface LongTermMemoryProps {
  memories: LongTermMemoryItem[];
  onRefresh: () => void;
}

const LongTermMemory: React.FC<LongTermMemoryProps> = ({ memories, onRefresh }) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const categories = ['all', ...new Set(memories.map(m => m.category))];

  const filteredMemories = filterCategory === 'all'
    ? memories
    : memories.filter(m => m.category === filterCategory);

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      '决策': 'bg-blue-100 text-blue-700',
      '教训': 'bg-red-100 text-red-700',
      '洞察': 'bg-green-100 text-green-700',
      '其他': 'bg-gray-100 text-gray-700'
    };
    return colors[category] || colors['其他'];
  };

  const getImportanceColor = (importance: number): string => {
    if (importance >= 8) return 'text-red-600';
    if (importance >= 6) return 'text-orange-600';
    if (importance >= 4) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <SparklesIcon className="h-5 w-5 mr-2 text-purple-600" />
              长期记忆
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              AI 自动提炼的智慧结晶
            </p>
          </div>

          <button
            onClick={onRefresh}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="刷新"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>

        {/* 分类过滤 */}
        <div className="mt-4 flex items-center space-x-2">
          <FunnelIcon className="h-4 w-4 text-gray-400" />
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setFilterCategory(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterCategory === category
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? '全部' : category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 记忆列表 */}
      {filteredMemories.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <SparklesIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            还没有长期记忆
          </h3>
          <p className="text-gray-500">
            {memories.length === 0
              ? '每天记录想法后，AI 会在午夜自动提炼重要内容到这里'
              : '该分类下还没有记忆'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMemories.map((memory) => (
            <div
              key={memory.id}
              className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              {/* 头部：标题和元信息 */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex-1">
                  {memory.title}
                </h3>
                <div className="flex items-center space-x-2 ml-3">
                  <span className={`text-sm font-bold ${getImportanceColor(memory.importance)}`}>
                    ★ {memory.importance}
                  </span>
                </div>
              </div>

              {/* 分类标签 */}
              <div className="mb-3">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(memory.category)}`}>
                  {memory.category}
                </span>
                {memory.source_date && (
                  <span className="ml-2 text-xs text-gray-500">
                    来源：{memory.source_date}
                  </span>
                )}
              </div>

              {/* 内容 */}
              <div className="text-gray-700 text-sm mb-3 whitespace-pre-wrap">
                {memory.content}
              </div>

              {/* 标签 */}
              {memory.tags && memory.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-gray-100">
                  {memory.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 创建时间 */}
              <div className="mt-3 text-xs text-gray-400">
                {new Date(memory.created_at).toLocaleString('zh-CN')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LongTermMemory;
