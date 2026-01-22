import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Moment, MomentImage } from '@/types';
import {
  uploadImageToOSS,
  validateImageType,
  validateImageSize,
  deleteImageFromOSS,
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
  images: (MomentImage & {
    file?: File;
    preview?: string;
    uploading?: boolean;
    progress?: number;
    fileName?: string;
  })[];
}

export default function MomentForm({ isOpen, onClose, initialData, onSave }: MomentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<MomentFormData>({
    content: '',
    visibility: 'public',
    images: []
  });
  
  const [uploadProgress, setUploadProgress] = useState<{[key: number]: number}>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        content: initialData.content,
        visibility: initialData.visibility,
        images: initialData.images || []
      });
    } else {
      setFormData({
        content: '',
        visibility: 'public',
        images: []
      });
    }
    // Reset upload states
    setUploadProgress({});
    setIsUploading(false);
    setUploadErrors([]);
  }, [initialData, isOpen]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    await processFiles(files);
    e.target.value = '';
  };

  const handleImageDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    if (files.length === 0) {
      toast.error('请拖拽图片文件');
      return;
    }
    await processFiles(files);
  };

  const processFiles = async (files: File[]) => {
    // 验证文件
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    for (const file of files) {
      if (!validateImageType(file)) {
        errors.push(`${file.name}: 不支持的文件类型`);
        continue;
      }
      if (!validateImageSize(file)) {
        errors.push(`${file.name}: 文件大小超过15MB限制`);
        continue;
      }
      validFiles.push(file);
    }
    
    if (errors.length > 0) {
      setUploadErrors(errors);
      toast.error(`部分文件验证失败：${errors.join(', ')}`);
    }
    
    if (validFiles.length === 0) return;
    
    // 先添加预览图片到状态中
    const newImages = validFiles.map((file) => ({
      file,
      image_url: '',
      preview: URL.createObjectURL(file),
      alt_text: '',
      uploading: true,
      progress: 0
    }));
    
    const startImageIndex = formData.images.length;
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
    
    setIsUploading(true);
    
    // 逐个上传图片
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const imageIndex = startImageIndex + i;
      
      try {
        console.log('🔍 [前端] 开始上传图片:', {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          imageIndex
        });
        
        const result = await uploadImageToOSS(file, (progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [imageIndex]: progress.percentage
          }));
          
          setFormData((prev: MomentFormData) => ({
            ...prev,
            images: prev.images.map((img, idx) => 
              idx === imageIndex ? { ...img, progress: progress.percentage } : img
            )
          }));
        });
        
        const uploadResult = result as UploadResult;

        if (uploadResult.success) {
          setFormData((prev: MomentFormData) => ({
            ...prev,
            images: prev.images.map((img, idx) => 
              idx === imageIndex ? {
                ...img,
                image_url: uploadResult.url || '',
                fileName: uploadResult.fileName,
                uploading: false,
                progress: 100
              } : img
            )
          }));
          toast.success(`${file.name} 上传成功`);
        } else {
          throw new Error(uploadResult.error || '上传失败');
        }
      } catch (error: any) {
        console.error('图片上传失败:', error);
        toast.error(`${file.name} 上传失败: ${error.message}`);
        
        // 移除上传失败的图片
        setFormData(prev => ({
          ...prev,
          images: prev.images.filter((_, idx) => idx !== imageIndex)
        }));
      }
    }
    
    setIsUploading(false);
    setUploadProgress({});
  };

  const removeImage = async (index: number) => {
    const imageToRemove = formData.images[index];
    
    // 如果图片已上传到OSS，则删除OSS文件
    if (imageToRemove.image_url && imageToRemove.fileName) {
      try {
        const success = await deleteImageFromOSS(imageToRemove.fileName);
        if (success) {
          toast.success('图片删除成功');
        } else {
          toast.error('删除OSS文件失败，但已从列表中移除');
        }
      } catch (error) {
        console.error('删除OSS文件失败:', error);
        toast.error('删除OSS文件失败，但已从列表中移除');
      }
    }
    
    // 清理预览URL
    if (imageToRemove.preview && imageToRemove.preview.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const updateImageAlt = (index: number, altText: string) => {
    const newImages = formData.images.map((image, i) => 
      i === index ? { ...image, alt_text: altText } : image
    );
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
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
    
    const textarea = e.target as HTMLTextAreaElement;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const textBefore = formData.content.substring(0, startPos);
    const textAfter = formData.content.substring(endPos);

    // Use a unique placeholder to avoid collisions
    const placeholderId = Date.now();
    const placeholder = `![上传中...](loading-${placeholderId})`;
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
      const uploadedImages = formData.images
        .filter(img => img.image_url) // Only include successfully uploaded images
        .map(img => ({
          image_url: img.image_url,
          alt_text: img.alt_text || ''
        }));
      
      const momentData = {
        content: formData.content,
        visibility: formData.visibility,
        images: uploadedImages
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
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({...prev, content: e.target.value}))}
                onPaste={handlePaste}
                rows={6}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF] resize-none"
                placeholder="分享你的想法..."
                required
              />
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

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                图片
              </label>
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-300'
                } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleImageDrop}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="moment-images"
                  disabled={isUploading}
                />
                <label htmlFor="moment-images" className="cursor-pointer">
                  <div className="text-slate-400 mb-2 text-4xl">📷</div>
                  <p className="text-slate-600">
                    {isUploading ? '正在上传...' : '点击选择图片或拖拽到此处'}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">支持多张图片上传</p>
                </label>
              </div>

              {/* 上传进度显示 */}
              {isUploading && Object.keys(uploadProgress).length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-slate-600 mb-1">
                    <span>上传进度</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-[#165DFF] h-2 rounded-full transition-all duration-300"
                      style={{ width: '100%' }} // Simple progress bar for now
                    ></div>
                  </div>
                </div>
              )}

              {/* 上传错误显示 */}
              {uploadErrors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm text-red-600">
                    <div className="font-medium mb-1">上传失败：</div>
                    <ul className="list-disc list-inside space-y-1">
                      {uploadErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* 图片预览 */}
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.preview || image.image_url}
                        alt={`预览 ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      {image.uploading && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <div className="text-white text-xs font-bold">{image.progress || 0}%</div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                      <input
                        type="text"
                        placeholder="图片描述"
                        value={image.alt_text || ''}
                        onChange={(e) => updateImageAlt(index, e.target.value)}
                        className="absolute bottom-1 left-1 right-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  ))}
                </div>
              )}
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
