import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiRequest } from '@/config/api';
import DailyThoughtEditor from '@/components/dashboard/DailyThoughtEditor';
import ThoughtsList from '@/components/dashboard/ThoughtsList';

interface DailyThought {
  id: number;
  thought_date: string;
  content: string;
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

  const handleSaveToday = async (content: string) => {
    try {
      const data = await apiRequest('/api/thoughts/today', {
        method: 'POST',
        body: JSON.stringify({ content })
      });
      setCurrentThought(data.data);
      toast.success('想法保存成功');
    } catch (error) {
      console.error('保存想法失败:', error);
      toast.error('保存想法失败');
      throw error;
    }
  };

  const today = getLocalToday();

  useEffect(() => {
    fetchThoughtByDate(selectedDate);
  }, [selectedDate]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 lg:self-start">
        <ThoughtsList selectedDate={selectedDate} onSelectDate={setSelectedDate} today={today} />
      </aside>

      <section className="lg:col-span-8 xl:col-span-9">
        <DailyThoughtEditor
          thought={currentThought}
          selectedDate={selectedDate}
          canEdit={canEdit}
          loading={loading}
          onSave={handleSaveToday}
          today={today}
        />
      </section>
    </div>
  );
}
