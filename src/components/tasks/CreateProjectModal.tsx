import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { Project } from '@/types/task';

interface CreateProjectModalProps {
  onClose: () => void;
  onSubmit: (project: {
    name: string;
    description: string;
    color: string;
    icon: string;
    start_date: string | null;
    end_date: string | null;
  }) => void;
  mode?: 'create' | 'edit';
  initialProject?: Project | null;
}

const COLORS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Green', value: '#10b981' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Crimson', value: '#dc2626' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Fuchsia', value: '#c026d3' },
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Coral', value: '#fb7185' },
  { name: 'Slate', value: '#64748b' },
  { name: 'Stone', value: '#78716c' }
];

const ICONS = [
  { name: 'Globe', value: 'globe' },
  { name: 'Book', value: 'book' },
  { name: 'Home', value: 'home' },
  { name: 'Code', value: 'code' },
  { name: 'Rocket', value: 'rocket' },
  { name: 'Briefcase', value: 'briefcase' }
];

const toFormData = (project?: Project | null) => ({
  name: project?.name || '',
  description: project?.description || '',
  color: project?.color || COLORS[0].value,
  icon: project?.icon || ICONS[0].value,
  start_date: project?.start_date || '',
  end_date: project?.end_date || ''
});

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  onClose,
  onSubmit,
  mode = 'create',
  initialProject = null
}) => {
  const [formData, setFormData] = useState(toFormData(initialProject));

  useEffect(() => {
    setFormData(toFormData(initialProject));
  }, [initialProject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('请输入项目名称');
      return;
    }

    const projectData = {
      name: formData.name,
      description: formData.description,
      color: formData.color,
      icon: formData.icon,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null
    };

    onSubmit(projectData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">{mode === 'edit' ? '编辑项目' : '新建项目'}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] px-4 sm:px-6 py-4">
          {/* 项目名称 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              项目名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="输入项目名称"
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
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="输入项目描述（可选）"
            />
          </div>

          {/* 颜色选择 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              颜色
            </label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color.value ? 'border-gray-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* 图标选择 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              图标
            </label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(icon => (
                <button
                  key={icon.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: icon.value })}
                  className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    formData.icon === icon.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {icon.name}
                </button>
              ))}
            </div>
          </div>

          {/* 日期范围 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
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
                结束日期
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          </div>

          {/* 按钮 */}
          <div className="flex justify-end space-x-3 px-4 sm:px-6 py-3 border-t shrink-0 bg-white">
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
              {mode === 'edit' ? '保存修改' : '创建项目'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
