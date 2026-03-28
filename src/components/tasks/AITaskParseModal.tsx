import React, { useMemo, useState } from 'react';
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { apiRequest } from '@/config/api';
import type { ParsedTaskDraft, TaskParseResponse } from '@/types/task';

type Project = {
  id: number;
  name: string;
  color: string;
};

type EditableTaskDraft = ParsedTaskDraft & {
  uid: string;
  selected: boolean;
  tagsText: string;
};

interface AITaskParseModalProps {
  projects: Project[];
  onClose: () => void;
  onConfirmCreate: (tasks: ParsedTaskDraft[]) => Promise<void>;
}

function getProjectTitlePrefix(projectId: number | null, projects: Project[]) {
  if (typeof projectId !== 'number') return '';
  const projectName = projects.find((project) => project.id === projectId)?.name || '';
  return projectName ? `【${projectName}】` : '';
}

function stripLeadingProjectPrefix(title: string) {
  return title.trim().replace(/^【[^】]+】\s*/, '').trim();
}

function ensureTitleWithProjectPrefix(title: string, projectId: number | null, projects: Project[]) {
  const baseTitle = stripLeadingProjectPrefix(title || '');
  const prefix = getProjectTitlePrefix(projectId, projects);
  return prefix ? `${prefix}${baseTitle}` : baseTitle;
}

function toEditableDraft(task: ParsedTaskDraft, index: number, projects: Project[]): EditableTaskDraft {
  const normalizedTitle = ensureTitleWithProjectPrefix(task.title || '', task.project_id ?? null, projects);
  const result = {
    uid: `${Date.now()}-${index}`,
    selected: true,
    ...task,
    title: normalizedTitle,
    tagsText: (task.tags || []).join(', ')
  };
  console.log(`[toEditableDraft] Task ${index}:`, {
    input: task,
    output: result,
    hasProjectId: result.project_id !== null,
    hasStartDate: result.start_date !== null,
    hasDueDate: result.due_date !== null
  });
  return result;
}

const AITaskParseModal: React.FC<AITaskParseModalProps> = ({ projects, onClose, onConfirmCreate }) => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [drafts, setDrafts] = useState<EditableTaskDraft[]>([]);

  const selectedCount = useMemo(() => drafts.filter((item) => item.selected).length, [drafts]);
  const isAllSelected = drafts.length > 0 && selectedCount === drafts.length;

  const handleParse = async () => {
    const text = inputText.trim();
    if (!text) {
      toast.error('请先粘贴任务文本');
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/api/tasks/ai-parse', {
        method: 'POST',
        body: JSON.stringify({ text })
      }) as TaskParseResponse;

      console.log('[AITaskParseModal] API Response:', JSON.stringify(response, null, 2));

      const items = Array.isArray(response?.data?.tasks) ? response.data.tasks : [];
      console.log('[AITaskParseModal] Parsed items:', JSON.stringify(items, null, 2));

      if (!items.length) {
        toast.error('未解析到任务，请补充更明确的信息');
        return;
      }

      const editableItems = items.map((item, index) => toEditableDraft(item, index, projects));
      console.log('[AITaskParseModal] Editable items:', JSON.stringify(editableItems, null, 2));
      setDrafts(editableItems);
      toast.success(`已解析 ${items.length} 条任务`);
    } catch (error) {
      console.error('Failed to parse task text:', error);
      toast.error('AI 解析失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const updateDraft = (uid: string, updater: (prev: EditableTaskDraft) => EditableTaskDraft) => {
    setDrafts((prev) => prev.map((item) => (item.uid === uid ? updater(item) : item)));
  };

  const handleStartDateChange = (uid: string, startDate: string) => {
    updateDraft(uid, (prev) => {
      const nextStartDate = startDate || null;
      if (nextStartDate && prev.due_date && prev.due_date < nextStartDate) {
        return {
          ...prev,
          start_date: nextStartDate,
          due_date: nextStartDate
        };
      }

      return {
        ...prev,
        start_date: nextStartDate
      };
    });
  };

  const handleCreate = async () => {
    const selectedDrafts = drafts.filter((item) => item.selected && item.title.trim());
    if (!selectedDrafts.length) {
      toast.error('请至少选择一条有效任务');
      return;
    }

    const payloads: ParsedTaskDraft[] = selectedDrafts.map((item) => ({
      title: item.title.trim(),
      description: item.description || '',
      project_id: item.project_id ?? null,
      priority: item.priority,
      tags: item.tagsText
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      start_date: item.start_date || null,
      due_date: item.due_date || null,
      warnings: item.warnings || []
    }));

    setCreating(true);
    try {
      await onConfirmCreate(payloads);
      onClose();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-[#165DFF]" />
            <h2 className="text-lg font-semibold text-slate-900">AI 解析待办任务</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <label className="mb-2 block text-sm font-medium text-slate-700">粘贴任务文本</label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={6}
            placeholder="例如：领导安排这周完成数据看板重构、补充接口文档并在周五前联调..."
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#165DFF] focus:ring-2 focus:ring-[#165DFF]/20"
          />

          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleParse}
              disabled={loading}
              className="rounded-lg bg-[#165DFF] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0E4BA4] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? '解析中...' : '开始解析'}
            </button>
            <span className="text-xs text-slate-500">支持一段文本拆分为多条任务，解析后可逐条修改。</span>
          </div>

          {drafts.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">解析结果（{drafts.length}）</h3>
                <button
                  type="button"
                  onClick={() => setDrafts((prev) => prev.map((item) => ({ ...item, selected: !isAllSelected })))}
                  className="text-xs text-[#165DFF] hover:text-[#0E4BA4]"
                >
                  {isAllSelected ? '取消全选' : '全选'}
                </button>
              </div>

              {drafts.map((item) => (
                <div key={item.uid} className="rounded-xl border border-slate-200 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={(e) => updateDraft(item.uid, (prev) => ({ ...prev, selected: e.target.checked }))}
                    />
                    <span className="text-xs text-slate-500">创建此任务</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateDraft(item.uid, (prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="任务标题"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    <select
                      value={item.project_id ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const nextProjectId = value ? Number(value) : null;
                        updateDraft(item.uid, (prev) => ({
                          ...prev,
                          project_id: nextProjectId,
                          title: ensureTitleWithProjectPrefix(prev.title, nextProjectId, projects)
                        }));
                      }}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="">无项目</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>

                  <textarea
                    value={item.description || ''}
                    onChange={(e) => updateDraft(item.uid, (prev) => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    placeholder="任务描述（可选）"
                    className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />

                  <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">优先级</label>
                      <select
                        value={item.priority}
                        onChange={(e) => updateDraft(item.uid, (prev) => ({ ...prev, priority: e.target.value as ParsedTaskDraft['priority'] }))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      >
                        <option value="P0">P0 - 紧急</option>
                        <option value="P1">P1 - 高</option>
                        <option value="P2">P2 - 中</option>
                        <option value="P3">P3 - 低</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">标签</label>
                      <input
                        type="text"
                        value={item.tagsText}
                        onChange={(e) => updateDraft(item.uid, (prev) => ({ ...prev, tagsText: e.target.value }))}
                        placeholder="标签，逗号分隔"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">开始日期</label>
                      <input
                        type="date"
                        value={item.start_date || ''}
                        onChange={(e) => handleStartDateChange(item.uid, e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">截止日期</label>
                      <input
                        type="date"
                        value={item.due_date || ''}
                        onChange={(e) => updateDraft(item.uid, (prev) => ({ ...prev, due_date: e.target.value || null }))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  {item.warnings && item.warnings.length > 0 && (
                    <div className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-700">
                      {item.warnings.join('；')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            取消
          </button>
          <button
            type="button"
            disabled={creating || selectedCount === 0}
            onClick={handleCreate}
            className="rounded-lg bg-[#165DFF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0E4BA4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? '创建中...' : `确认创建（${selectedCount}）`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AITaskParseModal;
