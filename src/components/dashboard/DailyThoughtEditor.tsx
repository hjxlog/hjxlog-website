import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  CalendarIcon,
  ClipboardDocumentIcon,
  LockClosedIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface DailyThought {
  id: number;
  thought_date: string;
  content: string;
  optimized_content?: string;
  created_at: string;
  updated_at: string;
}

interface DailyThoughtEditorProps {
  thought: DailyThought | null;
  selectedDate: string;
  canEdit: boolean;
  loading: boolean;
  onSave: (payload: { content: string; optimizedContent: string }) => Promise<void>;
  onOptimize: (content: string) => Promise<string>;
  today: string;
}

const formatDateTime = (value?: string) => {
  if (!value) return '--';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('zh-CN', { hour12: false });
};

const normalizeDate = (input?: string) => {
  if (!input) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const parsed = new Date(input);
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return input.includes('T') ? input.slice(0, 10) : input;
};

export default function DailyThoughtEditor({
  thought,
  selectedDate,
  canEdit,
  loading,
  onSave,
  onOptimize,
  today
}: DailyThoughtEditorProps) {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedContent, setOptimizedContent] = useState('');

  useEffect(() => {
    setContent(thought?.content || '');
    setOptimizedContent(thought?.optimized_content || '');
  }, [thought?.id, selectedDate, thought?.content, thought?.optimized_content, canEdit]);

  const displayDate = normalizeDate(thought?.thought_date) || selectedDate;
  const isToday = displayDate === today;
  const isEditable = canEdit || isToday;
  const wordCount = content.length;
  const readContent = content || '暂无内容';

  const handleSave = useCallback(async () => {
    if (!content.trim()) {
      toast.error('内容不能为空');
      return;
    }
    setIsSaving(true);
    try {
      await onSave({
        content,
        optimizedContent
      });
    } catch {
      // error handled by parent
    } finally {
      setIsSaving(false);
    }
  }, [content, onSave, optimizedContent]);

  const handleOptimize = useCallback(async () => {
    if (!content.trim()) {
      toast.error('想法内容不能为空');
      return;
    }
    setIsOptimizing(true);
    try {
      const result = await onOptimize(content);
      setOptimizedContent(result);
      toast.success('优化完成');
    } catch {
      // error handled by parent
    } finally {
      setIsOptimizing(false);
    }
  }, [content, onOptimize]);

  const handleCopyOptimized = useCallback(async () => {
    if (!optimizedContent.trim()) {
      return;
    }
    try {
      await navigator.clipboard.writeText(optimizedContent);
      toast.success('已复制优化结果');
    } catch {
      toast.error('复制失败，请手动复制');
    }
  }, [optimizedContent]);

  useEffect(() => {
    if (!isEditable) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isSaveShortcut =
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 's';

      if (!isSaveShortcut) return;
      event.preventDefault();

      if (!isSaving && content.trim()) {
        void handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditable, content, isSaving, handleSave]);

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-40 rounded bg-gray-200" />
          <div className="h-64 rounded bg-gray-200" />
          <div className="h-10 w-28 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <h2 className="text-base font-semibold text-gray-900">{displayDate}</h2>
            {isToday && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">今天</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="whitespace-nowrap">{wordCount} 字</span>
            <span className="whitespace-nowrap">更新于 {formatDateTime(thought?.updated_at)}</span>
            {isEditable && (
              <>
                <button
                  onClick={handleOptimize}
                  disabled={isOptimizing || !content.trim()}
                  className="inline-flex items-center whitespace-nowrap rounded-md bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  <SparklesIcon className="mr-1 h-3.5 w-3.5" />
                  {isOptimizing ? '优化中...' : 'AI优化动态文案'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !content.trim()}
                  className="whitespace-nowrap rounded-md bg-purple-600 px-3 py-1 text-xs font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {isSaving ? '保存中...' : '保存'}
                </button>
              </>
            )}
            {!isEditable && (
              <span className="inline-flex items-center whitespace-nowrap text-gray-400">
                <LockClosedIcon className="mr-1 h-4 w-4" />
                只读
              </span>
            )}
          </div>
        </div>
      </div>

      {!isEditable ? (
        <div className="p-5">
          <article className="min-h-[420px] whitespace-pre-wrap rounded-lg border border-gray-100 bg-gray-50 px-4 py-4 text-[15px] leading-7 text-gray-800">
            {readContent}
          </article>

          <div className="mt-5 flex justify-end">
            <p className="text-xs text-gray-500">历史记录仅供查看</p>
          </div>
        </div>
      ) : (
        <div>
          <div className="p-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写下今天的想法..."
              className="min-h-[460px] w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#165DFF] focus:outline-none focus:ring-2 focus:ring-[#165DFF] lg:min-h-[calc(100vh-300px)]"
            />
          </div>
          <div className="border-t border-gray-100 px-4 pb-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">AI 优化结果（用于发动态）</h3>
              <button
                onClick={handleCopyOptimized}
                disabled={!optimizedContent.trim()}
                className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                <ClipboardDocumentIcon className="mr-1 h-3.5 w-3.5" />
                复制
              </button>
            </div>
            <textarea
              value={optimizedContent}
              onChange={(e) => setOptimizedContent(e.target.value)}
              placeholder="点击上方“AI优化动态文案”后，这里会显示优化结果；你也可以继续编辑。"
              className="min-h-[140px] w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-800 placeholder:text-slate-400 focus:border-[#165DFF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#165DFF]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
