import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../config/api';
import { CalendarDaysIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface ThoughtsListProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  today: string;
}

interface ThoughtItem {
  thought_date: string;
  content: string;
}

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeDate = (input: string): string => {
  if (!input) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;

  const parsed = new Date(input);
  if (!Number.isNaN(parsed.getTime())) {
    return formatLocalDate(parsed);
  }

  return input.includes('T') ? input.slice(0, 10) : input;
};

const ThoughtsList: React.FC<ThoughtsListProps> = ({
  selectedDate,
  onSelectDate,
  today
}) => {
  const [thoughts, setThoughts] = useState<ThoughtItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchThoughtsList = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/api/thoughts?limit=30') as { success: boolean; data: any[] };
      setThoughts(data.data || []);
    } catch (error) {
      console.error('获取想法列表失败:', error);
      setThoughts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThoughtsList();
  }, []);

  const displayDates = (() => {
    const thoughtDates = thoughts
      .filter((t) => t.content && t.content.trim().length > 0)
      .map((t) => normalizeDate(t.thought_date))
      .filter(Boolean);
    return [...new Set(thoughtDates)].sort((a, b) => b.localeCompare(a));
  })();

  const getPreviewText = (date: string): string => {
    const thought = thoughts.find(t => normalizeDate(t.thought_date) === date);
    if (!thought || !thought.content) return '暂无记录';

    // 移除 Markdown 符号，获取纯文本预览
    const plainText = thought.content
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .replace(/\n/g, ' ')
      .trim();

    return plainText.length > 50
      ? plainText.substring(0, 50) + '...'
      : plainText;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="animate-pulse space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="h-5 w-5 text-purple-600" />
          <h2 className="text-base font-semibold text-gray-900">日期列表</h2>
        </div>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        {displayDates.map((date) => {
          const thought = thoughts.find(t => normalizeDate(t.thought_date) === date);
          const isSelected = date === selectedDate;
          const isToday = date === today;
          const hasContent = thought && thought.content && thought.content.trim().length > 0;

          return (
            <button
              key={date}
              onClick={() => onSelectDate(date)}
              className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                isSelected ? 'bg-purple-50 border-l-4 border-l-purple-600' : 'border-l-4 border-l-transparent'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${
                      isSelected ? 'text-purple-700' : 'text-gray-900'
                    }`}>
                      {date}
                    </span>
                    {isToday && (
                      <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                        今天
                      </span>
                    )}
                  </div>

                  <div className="mt-1 text-xs text-gray-500 flex items-center">
                    {hasContent ? (
                      <>
                        <DocumentTextIcon className="h-3 w-3 mr-1" />
                        {getPreviewText(date)}
                      </>
                    ) : (
                      <span className="italic">暂无记录</span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {thoughts.length === 0 && !loading && (
        <div className="p-6 text-center text-gray-500 text-sm">
          还没有任何想法记录<br />
          从今天开始记录吧！
        </div>
      )}
    </div>
  );
};

export default ThoughtsList;
