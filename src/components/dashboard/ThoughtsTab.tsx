import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CalendarDaysIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { apiRequest } from '@/config/api';
import DailyThoughtEditor from '@/components/dashboard/DailyThoughtEditor';
import ThoughtsList from '@/components/dashboard/ThoughtsList';
import LongTermMemory from '@/components/dashboard/LongTermMemory';

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
  const [memories, setMemories] = useState<LongTermMemoryItem[]>([]);

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

  const handleSaveToday = async (content: string, mood?: string, tags?: string[]) => {
    try {
      const data = await apiRequest('/api/thoughts/today', {
        method: 'POST',
        body: JSON.stringify({ content, mood, tags })
      });
      setCurrentThought(data.data);
      toast.success('想法保存成功');
    } catch (error) {
      console.error('保存想法失败:', error);
      toast.error('保存想法失败');
      throw error;
    }
  };

  const fetchLongTermMemories = async () => {
    try {
      const data = await apiRequest('/api/memory?limit=10');
      setMemories(data.data || []);
    } catch (error) {
      console.error('获取长期记忆失败:', error);
    }
  };

  const handleSummarize = async (date: string) => {
    if (!confirm(`确定要总结 ${date} 的想法吗？`)) return;

    try {
      await apiRequest(`/api/thoughts/summarize/${date}`, { method: 'POST' });
      toast.success('总结成功');
      fetchThoughtByDate(date);
      fetchLongTermMemories();
    } catch (error: any) {
      console.error('总结失败:', error);
      toast.error(error.message || '总结失败');
    }
  };

  const today = getLocalToday();

  useEffect(() => {
    fetchThoughtByDate(selectedDate);
    fetchLongTermMemories();
  }, [selectedDate]);

  return (
    <div className="space-y-6">
      <DailyThoughtEditor
        thought={currentThought}
        selectedDate={selectedDate}
        canEdit={canEdit}
        loading={loading}
        onSave={handleSaveToday}
        onSummarize={handleSummarize}
        today={today}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center mb-3">
            <CalendarDaysIcon className="h-4 w-4 mr-2 text-[#165DFF]" />
            历史日期
          </h3>
          <ThoughtsList selectedDate={selectedDate} onSelectDate={setSelectedDate} today={today} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center mb-3">
            <BookOpenIcon className="h-4 w-4 mr-2 text-[#165DFF]" />
            长期记忆
            {memories.length > 0 && (
              <span className="ml-2 bg-blue-50 text-blue-600 py-0.5 px-2 rounded-full text-xs">
                {memories.length}
              </span>
            )}
          </h3>
          <LongTermMemory memories={memories} onRefresh={fetchLongTermMemories} />
        </div>
      </div>
    </div>
  );
}
