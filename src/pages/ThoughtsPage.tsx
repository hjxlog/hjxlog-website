import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { apiRequest } from '../config/api';
import {
  ArrowLeftIcon,
  SparklesIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import DailyThoughtEditor from '../components/dashboard/DailyThoughtEditor';
import ThoughtsList from '../components/dashboard/ThoughtsList';

interface DailyThought {
  id: number;
  thought_date: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const ThoughtsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentThought, setCurrentThought] = useState<DailyThought | null>(null);
  const [canEdit, setCanEdit] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  // 获取指定日期的想法
  const fetchThoughtByDate = async (date: string) => {
    try {
      setLoading(true);
      const data = await apiRequest<{ success: boolean; data: DailyThought | null; canEdit: boolean }>(`/api/thoughts/${date}`);
      setCurrentThought(data.data);
      setCanEdit(data.canEdit);
    } catch (error) {
      console.error('获取想法失败:', error);
      toast.error('获取想法失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存今天的想法
  const handleSaveToday = async (content: string) => {
    try {
      const data = await apiRequest<{ success: boolean; data: DailyThought }>('/api/thoughts/today', {
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

  // 初始化加载
  useEffect(() => {
    fetchThoughtByDate(selectedDate);
  }, [selectedDate]);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <SparklesIcon className="h-7 w-7 mr-2 text-purple-600" />
                  每日想法
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  记录想法，保留每日思考轨迹
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500 flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                今天: {today}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* 主内容区 */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 lg:self-start">
            <ThoughtsList
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              today={today}
            />
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
      </div>
    </div>
  );
};

export default ThoughtsPage;
