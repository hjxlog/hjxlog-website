import React from 'react';
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

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
  const hasActiveFilters = Boolean(filters.project_id || filters.status || filters.priority || filters.search);

  const selectBaseClass = 'appearance-none w-full sm:w-auto min-w-[140px] px-3 pr-9 py-2.5 text-sm sm:text-sm text-slate-700 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:space-x-3">
      {/* 项目筛选 */}
      <div className="relative sm:inline-flex">
        <select
          value={filters.project_id || ''}
          onChange={(e) => updateFilter('project_id', e.target.value ? parseInt(e.target.value) : null)}
          className={selectBaseClass}
        >
          <option value="">所有项目</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>

      {/* 状态筛选 */}
      <div className="relative sm:inline-flex">
        <select
          value={filters.status || ''}
          onChange={(e) => updateFilter('status', e.target.value || null)}
          className={selectBaseClass}
        >
          <option value="">所有状态</option>
          <option value="todo">待办</option>
          <option value="in_progress">进行中</option>
          <option value="done">已完成</option>
          <option value="cancelled">已取消</option>
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>

      {/* 优先级筛选 */}
      <div className="relative sm:inline-flex">
        <select
          value={filters.priority || ''}
          onChange={(e) => updateFilter('priority', e.target.value || null)}
          className={selectBaseClass}
        >
          <option value="">所有优先级</option>
          <option value="P0">P0 - 紧急</option>
          <option value="P1">P1 - 高</option>
          <option value="P2">P2 - 中</option>
          <option value="P3">P3 - 低</option>
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>

      {/* 搜索框 */}
      <div className="relative sm:inline-flex">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="搜索任务..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-10 pr-4 py-2.5 text-sm sm:text-sm text-slate-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full sm:w-64"
        />
      </div>

      {/* 清除筛选 */}
      <button
        onClick={() => {
          if (!hasActiveFilters) return;
          onFiltersChange({
            project_id: null,
            status: null,
            priority: null,
            search: ''
          });
        }}
        disabled={!hasActiveFilters}
        className={`w-full sm:w-auto px-3 py-2 text-sm rounded-lg border transition-colors ${
          hasActiveFilters
            ? 'text-slate-700 border-slate-300 hover:bg-slate-50'
            : 'text-slate-400 border-slate-200 bg-slate-50 cursor-not-allowed'
        }`}
      >
        清除筛选
      </button>
    </div>
  );
};

export default TaskFilters;
