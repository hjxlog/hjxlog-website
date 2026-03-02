import React, { useEffect, useState, useCallback } from 'react';
import { XMarkIcon, EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { apiRequest } from '../../config/api';
import { Project, Task } from '../../types/task';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import TaskContentEditor from '@/components/tasks/TaskContentEditor';
import { parseTaskDate } from '@/utils/taskDate';
import { isTaskContentDoc, markdownToTaskContent, taskContentToMarkdown, TaskContentDoc } from '@/utils/taskContent';

interface TaskDetailProps {
  task: Task;
  projects?: Project[];
  onClose: () => void;
  onUpdate: () => void;
  variant?: 'peek' | 'page';
  onOpenAsPage?: (taskId: number) => void;
}

const TaskDetailSidebar: React.FC<TaskDetailProps> = ({
  task,
  projects = [],
  onClose,
  onUpdate,
  variant = 'peek',
  onOpenAsPage
}) => {
  const [title, setTitle] = useState(task.title || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [notes, setNotes] = useState(task.description || '');
  const [contentJson, setContentJson] = useState<TaskContentDoc>(
    isTaskContentDoc(task.content_json) ? task.content_json : markdownToTaskContent(task.description || '')
  );
  const [savingNotes, setSavingNotes] = useState(false);
  const [isPreview, setIsPreview] = useState(false); // false means "Live/Preview Mode", true means "Source Mode" (user logic inverted)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [meta, setMeta] = useState({
    status: task.status,
    priority: task.priority,
    project_id: task.project_id,
    start_date: '',
    due_date: '',
    tags: (task.tags || []).join(', ')
  });

  const toDateInputValue = (value?: string | null) => {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parsed = parseTaskDate(value);
    if (!parsed) return '';
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    setTitle(task.title || '');
    const initialContent = isTaskContentDoc(task.content_json)
      ? task.content_json
      : markdownToTaskContent(task.description || '');
    setContentJson(initialContent);
    setNotes(task.description || taskContentToMarkdown(initialContent));
    setIsPreview(false);
    setMeta({
      status: task.status,
      priority: task.priority,
      project_id: task.project_id,
      start_date: toDateInputValue(task.start_date),
      due_date: toDateInputValue(task.due_date),
      tags: (task.tags || []).join(', ')
    });
  }, [task.id, task.description, task.title]);

  const handleSaveTask = useCallback(async (closeAfterSave = false) => {
    try {
      setSavingNotes(true);
      await apiRequest(`/api/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title,
          description: notes,
          content_json: contentJson,
          content_version: 1,
          status: meta.status,
          priority: meta.priority,
          project_id: meta.project_id || null,
          start_date: meta.start_date || null,
          due_date: meta.due_date || null,
          tags: meta.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        })
      });
      toast.success('任务已保存');
      onUpdate();
      if (typeof closeAfterSave === 'boolean' && closeAfterSave) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to save task:', error);
      toast.error('保存失败');
    } finally {
      setSavingNotes(false);
    }
  }, [task.id, title, notes, contentJson, meta, onUpdate, onClose]);

  const handleStartDateChange = useCallback((startDate: string) => {
    setMeta((prev) => {
      if (startDate && prev.due_date && prev.due_date < startDate) {
        return {
          ...prev,
          start_date: startDate,
          due_date: startDate
        };
      }

      return {
        ...prev,
        start_date: startDate
      };
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
          return;
        }
        onClose();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveTask(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveTask, onClose, showDeleteConfirm]);

  const handleBackdropClick = async () => {
    await handleSaveTask(true);
  };

  const handleUpdateStatus = async (status: Task['status']) => {
    try {
      await apiRequest(`/api/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      setMeta((prev) => ({ ...prev, status }));
      toast.success('状态已更新');
      onUpdate();
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error('状态更新失败');
    }
  };

  const handleDeleteTask = async () => {
    if (deleting) return;
    try {
      setDeleting(true);
      await apiRequest(`/api/tasks/${task.id}`, { method: 'DELETE' });
      toast.success('任务已删除');
      setShowDeleteConfirm(false);
      onClose();
      onUpdate();
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('删除失败');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <>
      {variant === 'peek' && (
        <button
          type="button"
          aria-label="关闭任务编辑弹窗"
          onClick={handleBackdropClick}
          className="fixed inset-x-0 bottom-0 top-16 z-40 bg-black/30"
        />
      )}

      <aside
        className={
          variant === 'peek'
            ? 'fixed inset-x-0 bottom-0 top-16 z-50 flex items-start justify-center p-2 sm:p-5'
            : 'w-full'
        }
      >
        <div
          className={
            variant === 'peek'
              ? 'h-full w-full max-w-6xl rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col overflow-hidden'
              : 'w-full min-h-[calc(100vh-10rem)] rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col overflow-hidden'
          }
        >
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <div className="min-w-0 pr-3 flex-1">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsEditingTitle(false);
                    }
                  }}
                  autoFocus
                  className="w-full text-lg sm:text-xl font-semibold text-slate-900 border-b-2 border-[#165DFF] focus:outline-none bg-transparent px-1 py-0.5"
                />
              ) : (
                <h2 
                  className="text-lg sm:text-xl font-semibold text-slate-900 truncate cursor-text hover:bg-slate-100/50 rounded px-1 transition-colors py-0.5"
                  onDoubleClick={() => setIsEditingTitle(true)}
                  title="双击编辑标题"
                >
                  {title}
                </h2>
              )}
            </div>
            <div className="flex items-center gap-2">
              {variant === 'peek' && (
                <button
                  onClick={() => onOpenAsPage?.(task.id)}
                  className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  title="在页面中打开"
                >
                  页面打开
                </button>
              )}
              <button
                onClick={() => setIsPreview(!isPreview)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors mr-1"
                title={isPreview ? '编辑' : '预览'}
              >
                {isPreview ? (
                  <div className="flex items-center gap-1 text-xs font-medium">
                    <PencilSquareIcon className="h-4 w-4" />
                    <span>编辑</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs font-medium">
                    <EyeIcon className="h-4 w-4" />
                    <span>预览</span>
                  </div>
                )}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="删除任务"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
              <div className="h-4 w-px bg-slate-200 mx-1" />
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="grid h-full grid-cols-1 lg:grid-cols-[236px_minmax(0,1fr)] xl:grid-cols-[248px_minmax(0,1fr)]">
              <div className="overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/80 p-3.5 sm:p-4 space-y-3.5">
                <div>
                  <label className="block mb-1 text-[11px] font-semibold tracking-wide text-slate-500">状态</label>
                  <select
                    value={meta.status}
                    onChange={(e) => setMeta((prev) => ({ ...prev, status: e.target.value as Task['status'] }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#165DFF]/30 focus:border-[#165DFF]"
                  >
                    <option value="todo">待办</option>
                    <option value="in_progress">进行中</option>
                    <option value="done">完成</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-[11px] font-semibold tracking-wide text-slate-500">优先级</label>
                  <select
                    value={meta.priority}
                    onChange={(e) => setMeta((prev) => ({ ...prev, priority: e.target.value as Task['priority'] }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#165DFF]/30 focus:border-[#165DFF]"
                  >
                    <option value="P0">P0 紧急</option>
                    <option value="P1">P1 高优</option>
                    <option value="P2">P2 中优</option>
                    <option value="P3">P3 低优</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-[11px] font-semibold tracking-wide text-slate-500">项目</label>
                  <select
                    value={meta.project_id ?? ''}
                    onChange={(e) => setMeta((prev) => ({ ...prev, project_id: e.target.value ? Number(e.target.value) : null }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#165DFF]/30 focus:border-[#165DFF]"
                  >
                    <option value="">未归属项目</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block mb-1 text-[11px] font-semibold tracking-wide text-slate-500">开始日期</label>
                    <input
                      type="date"
                      value={meta.start_date}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#165DFF]/30 focus:border-[#165DFF]"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-[11px] font-semibold tracking-wide text-slate-500">截止日期</label>
                    <input
                      type="date"
                      value={meta.due_date}
                      onChange={(e) => setMeta((prev) => ({ ...prev, due_date: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#165DFF]/30 focus:border-[#165DFF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-[11px] font-semibold tracking-wide text-slate-500">标签（逗号分隔）</label>
                  <input
                    type="text"
                    value={meta.tags}
                    onChange={(e) => setMeta((prev) => ({ ...prev, tags: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#165DFF]/30 focus:border-[#165DFF]"
                    placeholder="例如：工作流, dashboard"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleSaveTask(false)}
                    disabled={savingNotes}
                    className="w-full px-3.5 py-2 text-sm font-medium text-white bg-[#165DFF] rounded-lg hover:bg-[#0E4BA4] disabled:opacity-60 shadow-sm transition-colors"
                  >
                    {savingNotes ? '保存中...' : '保存任务'}
                  </button>
                </div>
              </div>

              <div className="min-w-0 p-4 sm:p-6 lg:p-7 lg:h-full overflow-hidden flex flex-col">
                {isPreview ? (
                  <div 
                    className="w-full h-full rounded-xl border border-transparent px-1 py-1 text-sm text-slate-900 overflow-y-auto prose prose-sm max-w-none"
                    onDoubleClick={() => setIsPreview(false)}
                    title="双击编辑"
                  >
                    {notes ? (
                      <MarkdownRenderer content={notes} />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 cursor-pointer" onClick={() => setIsPreview(false)}>
                        <p>暂无内容，点击编辑</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative w-full h-full flex flex-col">
                    <TaskContentEditor
                      value={contentJson}
                      onChange={(doc, markdown) => {
                        setContentJson(doc);
                        setNotes(markdown);
                      }}
                    />
                    <div className="mt-2 text-xs text-slate-400 flex justify-between px-1">
                      <span>Notion 风格块编辑</span>
                      <span>自动保存到结构化内容</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>


        </div>
      </aside>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="删除任务"
        message="确定要删除该任务吗？此操作无法撤销。"
        confirmText={deleting ? '删除中...' : '删除'}
        cancelText="取消"
        onConfirm={handleDeleteTask}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmButtonClass="bg-rose-500 hover:bg-rose-600 text-white"
        cancelButtonClass="bg-slate-500 hover:bg-slate-600 text-white"
      />
    </>
  );
};

export default TaskDetailSidebar;
