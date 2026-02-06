import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  CalendarIcon,
  SparklesIcon,
  LockClosedIcon,
  PencilIcon,
  EyeIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';

interface DailyThought {
  id: number;
  thought_date: string;
  content: string;
  mood?: string;
  tags: string[];
  is_summarized: boolean;
  created_at: string;
  updated_at: string;
}

interface DailyThoughtEditorProps {
  thought: DailyThought | null;
  selectedDate: string;
  canEdit: boolean;
  loading: boolean;
  onSave: (content: string, mood?: string, tags?: string[]) => Promise<void>;
  onSummarize: (date: string) => void;
  onCreateTask?: () => void;
  today: string;
}

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeDate = (input?: string) => {
  if (!input) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;

  const parsed = new Date(input);
  if (!Number.isNaN(parsed.getTime())) {
    return formatLocalDate(parsed);
  }

  return input.includes('T') ? input.slice(0, 10) : input;
};

const DailyThoughtEditor: React.FC<DailyThoughtEditorProps> = ({
  thought,
  selectedDate,
  canEdit,
  loading,
  onSave,
  onSummarize,
  onCreateTask,
  today
}) => {
  const [content, setContent] = useState<string>('');
  const [mood, setMood] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (thought) {
      setContent(thought.content || '');
      setMood(thought.mood || '');
      setTags(thought.tags?.join(', ') || '');
    } else {
      setContent('');
      setMood('');
      setTags('');
    }
  }, [thought]);

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('内容不能为空');
      return;
    }

    setIsSaving(true);
    try {
      const tagsArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      await onSave(content, mood || undefined, tagsArray);
    } catch (error) {
      // Error already handled in parent
    } finally {
      setIsSaving(false);
    }
  };

  const handleSummarize = () => {
    if (thought) {
      onSummarize(normalizeDate(thought.thought_date));
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-40 bg-gray-200 rounded mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  const thoughtDate = normalizeDate(thought?.thought_date);
  const displayDate = thoughtDate || selectedDate;
  const isToday = displayDate === today;

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* 顶部信息栏 */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <span className="text-lg font-semibold text-gray-900">
              {displayDate}
            </span>
            {isToday && (
              <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                今天
              </span>
            )}
            {thought?.is_summarized && (
              <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                <SparklesIcon className="h-3 w-3 mr-1" />
                已总结
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {canEdit ? (
              <>
                <span className="text-xs text-gray-500 flex items-center">
                  <PencilIcon className="h-4 w-4 mr-1" />
                  可编辑
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-400 flex items-center">
                <LockClosedIcon className="h-4 w-4 mr-1" />
                只读
              </span>
            )}
          </div>
        </div>

        {mood && (
          <div className="mt-3">
            <span className="text-sm text-gray-600">心情：{mood}</span>
          </div>
        )}
      </div>

      {/* 纯文本编辑区 */}
      <div className="p-4">
        {canEdit ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            placeholder="写下今天的想法..."
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#165DFF] focus:border-[#165DFF] resize-y"
          />
        ) : (
          <div className="min-h-[280px] rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap">
            {content || '暂无内容'}
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* 心情输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              今天的心情（可选）
            </label>
            <input
              type="text"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              disabled={!canEdit}
              placeholder="例如：平静、兴奋、焦虑..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* 标签输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标签（可选，逗号分隔）
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={!canEdit}
              placeholder="例如：工作, 想法, TODO"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {content && (
              <span>{content.length} 字符</span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {canEdit && !thought && (
              <span className="text-xs text-slate-500">首次保存即新增今日想法</span>
            )}
            {thought && !thought.is_summarized && thoughtDate !== today && (
              <button
                onClick={handleSummarize}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center text-sm font-medium"
              >
                <SparklesIcon className="h-4 w-4 mr-2" />
                AI 总结
              </button>
            )}

            {onCreateTask && thought && (
              <button
                onClick={onCreateTask}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center text-sm font-medium"
              >
                <Squares2X2Icon className="h-4 w-4 mr-2" />
                创建任务
              </button>
            )}

            {canEdit && (
              <button
                onClick={handleSave}
                disabled={isSaving || !content.trim()}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isSaving ? '保存中...' : '保存想法'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyThoughtEditor;
