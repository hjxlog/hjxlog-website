import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface Project {
  id: number;
  name: string;
  color: string;
}

interface CreateTaskModalProps {
  projects: Project[];
  onClose: () => void;
  onSubmit: (task: any) => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ projects, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: projects.length > 0 ? projects[0].id : '',
    priority: 'P2',
    tags: '',
    due_date: ''
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
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                项目
              </label>
              <select
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: parseInt(e.target.value) })}
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

          {/* 标签和截止日期 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
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
