import React, { useEffect, useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface QuickAddProps {
  projects: Array<{ id: number; name: string; color: string }>;
  onSubmit: (taskData: any) => void;
  onClose: () => void;
}

/**
 * 智能解析任务输入
 * 支持格式：
 * - #工作 - 项目
 * - @重要 - 标签
 * - @P1 - 优先级
 * - 明天/后天/下周 - 截止日期
 */
const parseTaskInput = (input: string, projects: any[]) => {
  let title = input;
  const tags: string[] = [];
  let priority = 'P2';
  let project_id: number | null = null;
  let due_date: string | null = null;

  // 解析项目 #工作
  const projectMatch = input.match(/#(\S+)/);
  if (projectMatch) {
    const projectName = projectMatch[1];
    const project = projects.find(p => p.name === projectName);
    if (project) {
      project_id = project.id;
      title = title.replace(/#\S+/, '').trim();
    }
  }

  // 解析优先级 @P1
  const priorityMatch = input.match(/@P([0-3])/);
  if (priorityMatch) {
    priority = `P${priorityMatch[1]}`;
    title = title.replace(/@P[0-3]/, '').trim();
  }

  // 解析标签
  const tagMatches = input.matchAll(/@(\S+)/g);
  for (const match of tagMatches) {
    if (!match[1].startsWith('P')) {
      tags.push(match[1]);
    }
  }
  title = title.replace(/@\S+(?!\w)/g, '').trim();

  // 解析日期
  const today = new Date();
  if (input.includes('明天')) {
    today.setDate(today.getDate() + 1);
    due_date = today.toISOString().split('T')[0];
    title = title.replace(/明天/, '').trim();
  } else if (input.includes('后天')) {
    today.setDate(today.getDate() + 2);
    due_date = today.toISOString().split('T')[0];
    title = title.replace(/后天/, '').trim();
  } else if (input.includes('下周')) {
    today.setDate(today.getDate() + 7);
    due_date = today.toISOString().split('T')[0];
    title = title.replace(/下周/, '').trim();
  }

  return {
    title,
    description: '',
    project_id,
    priority,
    tags,
    due_date
  };
};

const QuickAddModal: React.FC<QuickAddProps> = ({ projects, onSubmit, onClose }) => {
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState<any>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    if (value.trim()) {
      const parsed = parseTaskInput(value, projects);
      setPreview(parsed);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || !preview) {
      toast.error('请输入任务内容');
      return;
    }

    onSubmit(preview);
    setInput('');
    setPreview(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">快速添加任务</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {/* 输入框 */}
          <div className="mb-4">
            <input
              type="text"
              value={input}
              onChange={handleChange}
              placeholder="输入任务... 例如：#工作 @重要 @P1 明天完成报告"
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* 提示 */}
          <div className="mb-4 text-sm text-gray-500">
            <p className="font-medium mb-2">支持的格式：</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-gray-100 rounded">#工作</span>
              <span className="px-2 py-1 bg-gray-100 rounded">@重要</span>
              <span className="px-2 py-1 bg-gray-100 rounded">@P1</span>
              <span className="px-2 py-1 bg-gray-100 rounded">明天</span>
              <span className="px-2 py-1 bg-gray-100 rounded">下周</span>
            </div>
          </div>

          {/* 预览 */}
          {preview && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">预览：</p>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">标题：</span>{preview.title || '(空)'}</p>
                <p><span className="font-medium">项目：</span>{preview.project_id ? projects.find(p => p.id === preview.project_id)?.name : '无'}</p>
                <p><span className="font-medium">优先级：</span>{preview.priority}</p>
                <p><span className="font-medium">标签：</span>{preview.tags.length > 0 ? preview.tags.join(', ') : '无'}</p>
                <p><span className="font-medium">截止：</span>{preview.due_date || '无'}</p>
              </div>
            </div>
          )}

          {/* 快捷键提示 */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>按 Enter 创建，Esc 取消</span>
            <div className="flex gap-4">
              <span>⌘K 打开</span>
              <span>↑↓ 切换</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAddModal;
