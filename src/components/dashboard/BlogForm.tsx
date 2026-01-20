import React, { useState, useEffect } from 'react';
import RichTextEditor from '@/components/RichTextEditor';
import { Blog } from '@/types';

interface BlogFormData {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string;
  published: boolean;
  featured: boolean;
  cover_image: string;
}

interface BlogFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Blog | null;
  onSave: (data: Partial<Blog>) => Promise<boolean>;
}

export default function BlogForm({ isOpen, onClose, initialData, onSave }: BlogFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isGeneratingCategory, setIsGeneratingCategory] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    tags: '',
    published: false,
    featured: false,
    cover_image: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        content: initialData.content,
        excerpt: initialData.excerpt,
        category: initialData.category,
        tags: initialData.tags.join(', '),
        published: initialData.published,
        featured: initialData.featured,
        cover_image: initialData.cover_image || ''
      });
    } else {
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        category: '',
        tags: '',
        published: false,
        featured: false,
        cover_image: ''
      });
    }
  }, [initialData, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
  };

  // 处理粘贴图片上传
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    let imageFile = null;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        imageFile = items[i].getAsFile();
        break;
      }
    }

    if (!imageFile) return;

    e.preventDefault();
    setIsUploading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', imageFile);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || '上传失败');
      }

      setFormData(prev => ({ ...prev, cover_image: data.data.url }));
    } catch (error: any) {
      console.error('图片上传失败:', error);
      alert(`图片上传失败: ${error.message || '未知错误'}`);
    } finally {
      setIsUploading(false);
    }
  };

  // AI 生成摘要
  const handleAIGenerateExcerpt = async () => {
    if (!formData.content) {
      alert('请先输入内容，AI 才能帮您生成摘要哦！');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/ai/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: formData.content }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '生成失败');
      }

      setFormData(prev => ({ ...prev, excerpt: data.data.summary }));
    } catch (error) {
      console.error('生成摘要失败:', error);
      alert('生成摘要失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // AI 生成标签
  const handleAIGenerateTags = async () => {
    if (!formData.content) {
      alert('请先输入内容，AI 才能帮您生成标签哦！');
      return;
    }

    setIsGeneratingTags(true);

    try {
      const response = await fetch('/api/ai/generate-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: formData.content }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '生成失败');
      }

      const newTags = data.data.tags.join(', ');
      setFormData(prev => ({ ...prev, tags: newTags }));
    } catch (error) {
      console.error('生成标签失败:', error);
      alert('生成标签失败，请稍后重试');
    } finally {
      setIsGeneratingTags(false);
    }
  };

  // AI 生成分类
  const handleAIGenerateCategory = async () => {
    if (!formData.content) {
      alert('请先输入内容，AI 才能帮您生成分类哦！');
      return;
    }

    setIsGeneratingCategory(true);

    try {
      const response = await fetch('/api/ai/generate-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: formData.content }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '生成失败');
      }

      setFormData(prev => ({ ...prev, category: data.data.category }));
    } catch (error) {
      console.error('生成分类失败:', error);
      alert('生成分类失败，请稍后重试');
    } finally {
      setIsGeneratingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const blogData: Partial<Blog> = {
      title: formData.title,
      content: formData.content,
      excerpt: formData.excerpt,
      category: formData.category,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      published: formData.published,
      featured: formData.featured,
      cover_image: formData.cover_image
    };

    try {
      const success = await onSave(blogData);
      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-slate-800">
              {initialData ? '编辑博客' : '写博客'}
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">标题</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-700">分类</label>
                  <button
                    type="button"
                    onClick={handleAIGenerateCategory}
                    disabled={isGeneratingCategory || !formData.content}
                    className="text-sm text-[#165DFF] hover:text-[#165DFF]/80 flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <i className={`fas ${isGeneratingCategory ? 'fa-spinner fa-spin' : 'fa-layer-group'}`}></i>
                    <span>{isGeneratingCategory ? '生成中...' : 'AI 生成分类'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">状态</label>
                <select
                  name="published"
                  value={formData.published ? 'true' : 'false'}
                  onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.value === 'true' }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                >
                  <option value="false">草稿</option>
                  <option value="true">已发布</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                  className="rounded border-slate-300 text-[#165DFF] shadow-sm focus:border-[#165DFF] focus:ring-[#165DFF]"
                />
                <label htmlFor="featured" className="ml-2 text-sm font-medium text-slate-700">
                  设为精选
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">封面图片</label>
              <div className="relative">
                <input
                  type="url"
                  name="cover_image"
                  value={formData.cover_image}
                  onChange={handleInputChange}
                  onPaste={handlePaste}
                  disabled={isUploading}
                  className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF] ${isUploading ? 'bg-slate-50 text-slate-500' : ''}`}
                  placeholder={isUploading ? "正在上传图片..." : "输入图片URL 或 粘贴截图 (Ctrl+V)"}
                />
                {isUploading && (
                  <div className="absolute right-3 top-2.5">
                    <i className="fas fa-spinner fa-spin text-[#165DFF]"></i>
                  </div>
                )}
              </div>
              {formData.cover_image && (
                <div className="mt-2">
                  <img
                    src={formData.cover_image}
                    alt="封面预览"
                    className="w-full h-32 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-700">摘要</label>
                <button
                  type="button"
                  onClick={handleAIGenerateExcerpt}
                  disabled={isGenerating || !formData.content}
                  className="text-sm text-[#165DFF] hover:text-[#165DFF]/80 flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <i className={`fas ${isGenerating ? 'fa-spinner fa-spin' : 'fa-magic'}`}></i>
                  <span>{isGenerating ? '生成中...' : 'AI 生成摘要'}</span>
                </button>
              </div>
              <input
                type="text"
                name="excerpt"
                value={formData.excerpt}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                placeholder="简短描述这篇博客的内容..."
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-700">标签 (用逗号分隔)</label>
                <button
                  type="button"
                  onClick={handleAIGenerateTags}
                  disabled={isGeneratingTags || !formData.content}
                  className="text-sm text-[#165DFF] hover:text-[#165DFF]/80 flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <i className={`fas ${isGeneratingTags ? 'fa-spinner fa-spin' : 'fa-tags'}`}></i>
                  <span>{isGeneratingTags ? '生成中...' : 'AI 生成标签'}</span>
                </button>
              </div>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                placeholder="React, JavaScript, 前端开发"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">内容</label>
              <RichTextEditor
                value={formData.content}
                onChange={handleContentChange}
                placeholder="开始写作..."
                height={400}
              />
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
                {isSubmitting ? '保存中...' : (initialData ? '更新博客' : '发布博客')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
