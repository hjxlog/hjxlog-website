import React from 'react';

interface Project {
  id: number;
  name: string;
  color: string;
}

interface TaskFiltersProps {
  projects: Project[];
  filters: {
    project_id: number | null;
    status: string | null;
    priority: string | null;
    search: string;
  };
  onFiltersChange: (filters: any) => void;
}

const TaskFilters: React.FC<TaskFiltersProps> = ({ projects, filters, onFiltersChange }) => {
  const updateFilter = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex items-center space-x-3">
      {/* 项目筛选 */}
      <select
        value={filters.project_id || ''}
        onChange={(e) => updateFilter('project_id', e.target.value ? parseInt(e.target.value) : null)}
        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      >
        <option value="">所有项目</option>
        {projects.map(project => (
          <option key={project.id} value={project.id}>{project.name}</option>
        ))}
      </select>

      {/* 状态筛选 */}
      <select
        value={filters.status || ''}
        onChange={(e) => updateFilter('status', e.target.value || null)}
        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      >
        <option value="">所有状态</option>
        <option value="todo">待办</option>
        <option value="in_progress">进行中</option>
        <option value="done">已完成</option>
      </select>

      {/* 优先级筛选 */}
      <select
        value={filters.priority || ''}
        onChange={(e) => updateFilter('priority', e.target.value || null)}
        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      >
        <option value="">所有优先级</option>
        <option value="P0">P0 - 紧急</option>
        <option value="P1">P1 - 高</option>
        <option value="P2">P2 - 中</option>
        <option value="P3">P3 - 低</option>
      </select>

      {/* 搜索框 */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="搜索任务..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
        />
      </div>

      {/* 清除筛选 */}
      {(filters.project_id || filters.status || filters.priority || filters.search) && (
        <button
          onClick={() => onFiltersChange({
            project_id: null,
            status: null,
            priority: null,
            search: ''
          })}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          清除筛选
        </button>
      )}
    </div>
  );
};

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default TaskFilters;
