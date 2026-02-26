import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiRequest } from '@/config/api';
import DailyThoughtEditor from '@/components/dashboard/DailyThoughtEditor';
import ThoughtsList from '@/components/dashboard/ThoughtsList';

interface DailyThought {
  id: number;
  thought_date: string;
  content: string;
  optimized_content?: string;
  created_at: string;
  updated_at: string;
}

const getLocalToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ThoughtsTab() {
  const [selectedDate, setSelectedDate] = useState<string>(getLocalToday());
  const [currentThought, setCurrentThought] = useState<DailyThought | null>(null);
  const [canEdit, setCanEdit] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [isListCollapsed, setIsListCollapsed] = useState<boolean>(true);

  const fetchThoughtByDate = async (date: string) => {
    try {
      setLoading(true);
      const data = await apiRequest(`/api/thoughts/${date}`);
      setCurrentThought(data.data);
      setCanEdit(data.canEdit);
    } catch (error) {
      console.error('获取想法失败:', error);
      toast.error('获取想法失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToday = async ({ content, optimizedContent }: { content: string; optimizedContent: string }) => {
    try {
      const data = await apiRequest('/api/thoughts/today', {
        method: 'POST',
        body: JSON.stringify({
          content,
          optimized_content: optimizedContent
        })
      });
      setCurrentThought(data.data);
      toast.success('想法保存成功');
    } catch (error) {
      console.error('保存想法失败:', error);
      toast.error('保存想法失败');
      throw error;
    }
  };

  const handleOptimizeThought = async (content: string) => {
    try {
      const data = await apiRequest(`/api/thoughts/${selectedDate}/optimize`, {
        method: 'POST',
        body: JSON.stringify({ content })
      });
      const optimizedContent = data?.data?.optimized_content || '';
      if (!optimizedContent) {
        throw new Error('AI 返回内容为空');
      }
      return optimizedContent;
    } catch (error) {
      console.error('优化想法失败:', error);
      toast.error('优化想法失败');
      throw error;
    }
  };

  const today = getLocalToday();

  useEffect(() => {
    fetchThoughtByDate(selectedDate);
  }, [selectedDate]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">历史记录</span>
        <button
          onClick={() => setIsListCollapsed((prev) => !prev)}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          {isListCollapsed ? '展开' : '收起'}
        </button>
      </div>

      <div className={`grid grid-cols-1 gap-4 ${isListCollapsed ? '' : 'lg:grid-cols-12'} items-start`}>
        {!isListCollapsed && (
          <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-0">
            <ThoughtsList selectedDate={selectedDate} onSelectDate={setSelectedDate} today={today} />
          </aside>
        )}

        <section className={isListCollapsed ? '' : 'lg:col-span-8 xl:col-span-9'}>
          <DailyThoughtEditor
            thought={currentThought}
            selectedDate={selectedDate}
            canEdit={canEdit}
            loading={loading}
            onSave={handleSaveToday}
            onOptimize={handleOptimizeThought}
            today={today}
          />
        </section>
      </div>
    </div>
  );
}
