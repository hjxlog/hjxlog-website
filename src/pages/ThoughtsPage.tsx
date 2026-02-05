import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { apiRequest } from '../config/api';
import {
  ArrowLeftIcon,
  PlusIcon,
  CalendarDaysIcon,
  SparklesIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import MDEditor from '@uiw/react-md-editor';
import DailyThoughtEditor from '../components/admin/DailyThoughtEditor';
import ThoughtsList from '../components/admin/ThoughtsList';
import LongTermMemory from '../components/admin/LongTermMemory';
import CreateTaskFromThoughtModal from '../components/tasks/CreateTaskFromThoughtModal';

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

const ThoughtsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentThought, setCurrentThought] = useState<DailyThought | null>(null);
  const [canEdit, setCanEdit] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [memories, setMemories] = useState<LongTermMemoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'thoughts' | 'memory'>('thoughts');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [projects, setProjects] = useState<Array<{ id: number; name: string; color: string }>>([]);

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
  const handleSaveToday = async (content: string, mood?: string, tags?: string[]) => {
    try {
      const data = await apiRequest<{ success: boolean; data: DailyThought }>('/api/thoughts/today', {
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

  // 获取长期记忆
  const fetchLongTermMemories = async () => {
    try {
      const data = await apiRequest<{ success: boolean; data: LongTermMemoryItem[]; total: number }>('/api/memory?limit=10');
      setMemories(data.data || []);
    } catch (error) {
      console.error('获取长期记忆失败:', error);
    }
  };

  // 手动触发总结
  const handleSummarize = async (date: string) => {
    if (!confirm(`确定要总结 ${date} 的想法吗？`)) {
      return;
    }

    try {
      await apiRequest(`/api/thoughts/summarize/${date}`, {
        method: 'POST'
      });
      toast.success('总结成功');
      fetchThoughtByDate(date);
      fetchLongTermMemories();
    } catch (error: any) {
      console.error('总结失败:', error);
      toast.error(error.message || '总结失败');
    }
  };

  // 从想法创建任务
  const handleCreateTaskFromThought = async (taskData: any) => {
    try {
      await apiRequest('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });
      toast.success('任务创建成功');
      setShowCreateTask(false);
    } catch (error: any) {
      console.error('创建任务失败:', error);
      toast.error(error.message || '创建任务失败');
    }
  };

  // 初始化加载
  useEffect(() => {
    fetchThoughtByDate(selectedDate);
    fetchLongTermMemories();
    fetchProjects();
  }, [selectedDate]);

  // 获取项目列表
  const fetchProjects = async () => {
    try {
      const data = await apiRequest<{ success: boolean; data: Array<{ id: number; name: string; color: string }> }>('/api/tasks/projects');
      setProjects(data.data || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

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
                  记录想法，AI 自动提炼到长期记忆
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

          {/* 标签页切换 */}
          <div className="flex space-x-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('thoughts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'thoughts'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              每日想法
            </button>
            <button
              onClick={() => setActiveTab('memory')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'memory'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              长期记忆
              {memories.length > 0 && (
                <span className="ml-2 bg-purple-100 text-purple-600 py-0.5 px-2 rounded-full text-xs">
                  {memories.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'thoughts' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：日期列表 */}
            <div className="lg:col-span-1">
              <ThoughtsList
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                today={today}
              />
            </div>

            {/* 右侧：编辑器/查看器 */}
            <div className="lg:col-span-2">
              <DailyThoughtEditor
                thought={currentThought}
                canEdit={canEdit}
                loading={loading}
                onSave={handleSaveToday}
                onSummarize={handleSummarize}
                onCreateTask={() => setShowCreateTask(true)}
                today={today}
              />
            </div>
          </div>
        ) : (
          <LongTermMemory memories={memories} onRefresh={fetchLongTermMemories} />
        )}
      </div>

      {/* 创建任务弹窗 */}
      {showCreateTask && currentThought && (
        <CreateTaskFromThoughtModal
          thoughtContent={currentThought.content}
          thoughtDate={currentThought.thought_date}
          projects={projects}
          onClose={() => setShowCreateTask(false)}
          onSubmit={handleCreateTaskFromThought}
        />
      )}
    </div>
  );
};

export default ThoughtsPage;
