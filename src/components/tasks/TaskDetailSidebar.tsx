import React, { useEffect, useState, useCallback } from 'react';
import { XMarkIcon, EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { apiRequest } from '../../config/api';
import { Project, Task } from '../../types/task';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  uploadImageToOSS,
  validateImageType,
  validateImageSize,
  UploadResult
} from '@/utils/ossUpload';
import { parseTaskDate } from '@/utils/taskDate';

interface TaskDetailProps {
  task: Task;
  projects?: Project[];
  onClose: () => void;
  onUpdate: () => void;
}

const TaskDetailSidebar: React.FC<TaskDetailProps> = ({ task, projects = [], onClose, onUpdate }) => {
  const [title, setTitle] = useState(task.title || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [notes, setNotes] = useState(task.description || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [isPreview, setIsPreview] = useState(false); // false means "Live/Preview Mode", true means "Source Mode" (user logic inverted)
  const [dragOver, setDragOver] = useState(false);
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
    setNotes(task.description || '');
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

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length === 0) return;

    // Validate files first
    const validFiles: File[] = [];
    for (const file of files) {
      if (!validateImageType(file)) {
        toast.error(`${file.name}: 不支持的文件类型`);
        continue;
      }
      if (!validateImageSize(file)) {
        toast.error(`${file.name}: 文件大小超过15MB限制`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    const textarea = e.currentTarget;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const textBefore = notes.substring(0, startPos);
    const textAfter = notes.substring(endPos);
    
    let newContent = textBefore;
    const uploads = [];

    // Insert placeholders
    for (const file of validFiles) {
        const placeholderId = Date.now().toString() + Math.random().toString(36).substring(7);
        const placeholder = `![上传中...](${placeholderId})`;
        newContent += placeholder;
        uploads.push({ file, placeholder });
    }
    
    newContent += textAfter;
    setNotes(newContent);

    // Perform uploads
    uploads.forEach(async ({ file, placeholder }) => {
        try {
            const result = await uploadImageToOSS(file);
            const uploadResult = result as UploadResult;
            if (uploadResult.success && uploadResult.url) {
                const imageMarkdown = `![${file.name || 'image'}](${uploadResult.url})`;
                setNotes(prev => prev.replace(placeholder, imageMarkdown));
                toast.success(`${file.name} 上传成功`);
            } else {
                throw new Error(uploadResult.error || '上传失败');
            }
        } catch (error) {
            console.error('上传失败:', error);
            toast.error(`${file.name} 上传失败`);
            setNotes(prev => prev.replace(placeholder, '')); // Remove placeholder on error
        }
    });
  }, [notes]);

  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    let imageFile: File | null = null;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        imageFile = items[i].getAsFile();
        break;
      }
    }

    if (!imageFile) return;

    e.preventDefault();

    if (!validateImageType(imageFile)) {
      toast.error('不支持的文件类型');
      return;
    }
    if (!validateImageSize(imageFile)) {
      toast.error('文件大小超过15MB限制');
      return;
    }
    
    const textarea = e.currentTarget;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const textBefore = notes.substring(0, startPos);
    const textAfter = notes.substring(endPos);

    const placeholderId = Date.now();
    const placeholder = `![上传中...](${placeholderId})`;
    const newContent = textBefore + placeholder + textAfter;
    
    setNotes(newContent);

    try {
      const result = await uploadImageToOSS(imageFile);
      const uploadResult = result as UploadResult;

      if (uploadResult.success && uploadResult.url) {
        const imageMarkdown = `![${imageFile.name || 'image'}](${uploadResult.url})`;
        setNotes(prev => prev.replace(placeholder, imageMarkdown));
        toast.success('图片上传成功');
      } else {
        throw new Error(uploadResult.error || '上传失败');
      }
    } catch (error) {
      console.error('图片粘贴上传失败:', error);
      const message = error instanceof Error ? error.message : '上传失败';
      toast.error(`上传失败: ${message}`);
      setNotes(prev => prev.replace(placeholder, ''));
    }
  }, [notes]);

  const handleSaveTask = useCallback(async (closeAfterSave = false) => {
    try {
      setSavingNotes(true);
      await apiRequest(`/api/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title,
          description: notes,
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
  }, [task.id, title, notes, meta, onUpdate, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveTask(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveTask]);

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
      <button
        type="button"
        aria-label="关闭任务编辑弹窗"
        onClick={handleBackdropClick}
        className="fixed inset-x-0 bottom-0 top-16 z-40 bg-black/30"
      />

      <aside className="fixed inset-x-0 bottom-0 top-16 z-50 flex items-start justify-center p-2 sm:p-5">
        <div className="h-full w-full max-w-6xl rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col overflow-hidden">
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
                      onChange={(e) => setMeta((prev) => ({ ...prev, start_date: e.target.value }))}
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
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      onPaste={handlePaste}
                      onDrop={handleDrop}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      placeholder="写下任务过程、补充说明、结论...支持 Markdown。可以直接粘贴或拖拽图片上传。"
                      className={`flex-1 w-full min-h-[300px] rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#165DFF]/30 focus:border-[#165DFF] resize-none leading-7 transition-colors ${
                        dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-300'
                      }`}
                    />
                    {dragOver && (
                      <div className="absolute inset-0 bg-blue-50/50 flex items-center justify-center pointer-events-none rounded-xl border-2 border-blue-400 border-dashed z-10">
                        <div className="text-blue-500 font-medium flex items-center bg-white px-4 py-2 rounded-lg shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                          </svg>
                          释放图片以上传
                        </div>
                      </div>
                    )}
                    <div className="mt-2 text-xs text-slate-400 flex justify-between px-1">
                      <span>支持 Markdown 语法</span>
                      <span>可直接粘贴或拖拽图片上传</span>
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
