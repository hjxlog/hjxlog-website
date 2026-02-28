import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { parseTaskDate } from '@/utils/taskDate';

interface Project {
  id: number;
  name: string;
  color: string;
}

interface CreateTaskModalProps {
  projects: Project[];
  onClose: () => void;
  onSubmit: (task: any) => void;
  onProjectChange?: (projectId: number | '') => void;
  initialTask?: {
    title?: string;
    description?: string;
    project_id?: number | '';
    priority?: string;
    tags?: string;
    start_date?: string;
    due_date?: string;
  };
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ projects, onClose, onSubmit, onProjectChange, initialTask }) => {
  const getProjectNameById = (projectId?: number | '') => {
    if (typeof projectId !== 'number') return '';
    return projects.find(project => project.id === projectId)?.name || '';
  };

  const getProjectTitlePrefix = (projectId?: number | '') => {
    const projectName = getProjectNameById(projectId);
    return projectName ? `【${projectName}】` : '';
  };

  const todayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const toDateInputValue = (value?: string) => {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parsed = parseTaskDate(value);
    if (!parsed) return '';
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getInitialFormData = () => ({
    title: '',
    description: initialTask?.description || '',
    project_id: initialTask?.project_id ?? (projects.length > 0 ? projects[0].id : ''),
    priority: initialTask?.priority || 'P2',
    tags: initialTask?.tags || '',
    start_date: toDateInputValue(initialTask?.start_date) || todayDate(),
    due_date: toDateInputValue(initialTask?.due_date) || todayDate()
  });

  const [formData, setFormData] = useState(() => {
    const initialFormData = getInitialFormData();
    return {
      ...initialFormData,
      title: initialTask?.title || getProjectTitlePrefix(initialFormData.project_id)
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('请输入任务标题');
      return;
    }

    const taskData = {
      title: formData.title,
      description: formData.description,
      project_id: formData.project_id || null,
      priority: formData.priority,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      start_date: formData.start_date || null,
      due_date: formData.due_date || null
    };

    onSubmit(taskData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">新建任务</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* 标题 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="输入任务标题"
              autoFocus
            />
          </div>

          {/* 描述 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="输入任务描述（可选）"
            />
          </div>

          {/* 项目和优先级 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                项目
              </label>
              <select
                value={formData.project_id}
                onChange={(e) => {
                  const nextValue = Number(e.target.value);
                  setFormData((prev) => {
                    const previousPrefix = getProjectTitlePrefix(prev.project_id);
                    const nextPrefix = getProjectTitlePrefix(nextValue);
                    const shouldAutoFillTitle = !prev.title.trim() || prev.title === previousPrefix;
                    return {
                      ...prev,
                      project_id: nextValue,
                      title: shouldAutoFillTitle ? nextPrefix : prev.title
                    };
                  });
                  onProjectChange?.(nextValue);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                优先级
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="P0">P0 - 紧急</option>
                <option value="P1">P1 - 高</option>
                <option value="P2">P2 - 中</option>
                <option value="P3">P3 - 低</option>
              </select>
            </div>
          </div>

          {/* 标签和时间 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标签
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="用逗号分隔"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                开始日期
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                截止日期
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              创建任务
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
