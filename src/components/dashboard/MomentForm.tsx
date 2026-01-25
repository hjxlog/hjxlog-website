import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Moment } from '@/types';
import {
  uploadImageToOSS,
  validateImageType,
  validateImageSize,
  UploadResult
} from '@/utils/ossUpload';

interface MomentFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Moment | null;
  onSave: (data: any) => Promise<boolean>;
}

interface MomentFormData {
  content: string;
  visibility: 'public' | 'private';
}

export default function MomentForm({ isOpen, onClose, initialData, onSave }: MomentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<MomentFormData>({
    content: '',
    visibility: 'public'
  });
  
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        content: initialData.content,
        visibility: initialData.visibility
      });
    } else {
      setFormData({
        content: '',
        visibility: 'public'
      });
    }
  }, [initialData, isOpen]);

  const handleDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
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
    const textBefore = formData.content.substring(0, startPos);
    const textAfter = formData.content.substring(endPos);
    
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
    setFormData(prev => ({ ...prev, content: newContent }));

    // Perform uploads
    uploads.forEach(async ({ file, placeholder }) => {
        try {
            const result = await uploadImageToOSS(file);
            const uploadResult = result as UploadResult;
            if (uploadResult.success && uploadResult.url) {
                const imageMarkdown = `![${file.name || 'image'}](${uploadResult.url})`;
                setFormData(prev => ({
                    ...prev,
                    content: prev.content.replace(placeholder, imageMarkdown)
                }));
                toast.success(`${file.name} 上传成功`);
            } else {
                throw new Error(uploadResult.error || '上传失败');
            }
        } catch (error: any) {
            console.error('上传失败:', error);
            toast.error(`${file.name} 上传失败`);
            setFormData(prev => ({
                ...prev,
                content: prev.content.replace(placeholder, '') // Remove placeholder on error
            }));
        }
    });
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
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
    const textBefore = formData.content.substring(0, startPos);
    const textAfter = formData.content.substring(endPos);

    const placeholderId = Date.now();
    const placeholder = `![上传中...](${placeholderId})`;
    const newContent = textBefore + placeholder + textAfter;
    
    setFormData(prev => ({ ...prev, content: newContent }));

    try {
      const result = await uploadImageToOSS(imageFile);
      const uploadResult = result as UploadResult;

      if (uploadResult.success && uploadResult.url) {
        const imageMarkdown = `![${imageFile.name || 'image'}](${uploadResult.url})`;
        setFormData(prev => ({
          ...prev,
          content: prev.content.replace(placeholder, imageMarkdown)
        }));
        toast.success('图片上传成功');
      } else {
        throw new Error(uploadResult.error || '上传失败');
      }
    } catch (error: any) {
      console.error('图片粘贴上传失败:', error);
      toast.error(`上传失败: ${error.message}`);
      setFormData(prev => ({
        ...prev,
        content: prev.content.replace(placeholder, '')
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const momentData = {
        content: formData.content,
        visibility: formData.visibility
      };
      
      const success = await onSave(momentData);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('保存动态失败:', error);
      toast.error('保存动态失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-slate-800">
              {initialData ? '编辑动态' : '发布动态'}
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                内容 *
              </label>
              <div className="relative">
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({...prev, content: e.target.value}))}
                  onPaste={handlePaste}
                  onDrop={handleDrop}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  rows={12}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF] resize-none transition-colors ${
                    dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-300'
                  }`}
                  placeholder="分享你的想法..."
                  required
                />
                {dragOver && (
                  <div className="absolute inset-0 bg-blue-50/50 flex items-center justify-center pointer-events-none rounded-lg border-2 border-blue-400 border-dashed">
                    <div className="text-blue-500 font-medium flex items-center">
                      <i className="fas fa-cloud-upload-alt mr-2 text-xl"></i>
                      释放图片以上传
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                支持 Markdown 语法，可直接粘贴或拖拽图片上传
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                可见性
              </label>
              <select
                value={formData.visibility}
                onChange={(e) => setFormData(prev => ({...prev, visibility: e.target.value as 'public' | 'private'}))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
              >
                <option value="public">公开</option>
                <option value="private">私密</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-[#165DFF]/90 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? '保存中...' : (initialData ? '更新动态' : '发布动态')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
