import React, { useState, useEffect } from 'react';
import RichTextEditor from '@/components/RichTextEditor';

interface Work {
  id: number;
  title: string;
  description: string;
  content?: string;
  category: string;
  status: string;
  tags: string[];
  technologies: string[];
  project_url: string;
  github_url: string;
  cover_image: string;
  screenshots?: string[];
  features?: string[];
  challenges?: string[];
  featured: boolean;
  created_at?: string;
  updated_at?: string;
  date?: string;
}

interface WorkFormData {
  title: string;
  description: string;
  content: string;
  category: string;
  status: string;
  tags: string;
  technologies: string;
  project_url: string;
  github_url: string;
  cover_image: string;
  screenshots: string;
  features: string;
  challenges: string;
  featured: boolean;
}

interface WorkFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Work | null;
  onSave: (data: Partial<Work>) => Promise<boolean>;
}

export default function WorkForm({ isOpen, onClose, initialData, onSave }: WorkFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<WorkFormData>({
    title: '',
    description: '',
    content: '',
    category: '',
    status: 'active',
    tags: '',
    technologies: '',
    project_url: '',
    github_url: '',
    cover_image: '',
    screenshots: '',
    features: '',
    challenges: '',
    featured: false
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description,
        content: initialData.content || '',
        category: initialData.category,
        status: initialData.status,
        tags: initialData.tags.join(', '),
        technologies: initialData.technologies.join(', '),
        project_url: initialData.project_url,
        github_url: initialData.github_url,
        cover_image: initialData.cover_image,
        screenshots: initialData.screenshots?.join(', ') || '',
        features: initialData.features?.join(', ') || '',
        challenges: initialData.challenges?.join(', ') || '',
        featured: initialData.featured
      });
    } else {
      setFormData({
        title: '',
        description: '',
        content: '',
        category: '',
        status: 'active',
        tags: '',
        technologies: '',
        project_url: '',
        github_url: '',
        cover_image: '',
        screenshots: '',
        features: '',
        challenges: '',
        featured: false
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDescriptionChange = (value: string) => {
    setFormData(prev => ({ ...prev, description: value }));
  };

  const handleContentChange = (value: string) => {
    setFormData(prev => ({ ...prev, content: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const workData: Partial<Work> = {
      title: formData.title,
      description: formData.description,
      content: formData.content,
      category: formData.category,
      status: formData.status,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      technologies: formData.technologies.split(',').map(tech => tech.trim()).filter(tech => tech),
      project_url: formData.project_url,
      github_url: formData.github_url,
      cover_image: formData.cover_image,
      screenshots: formData.screenshots.split(',').map(url => url.trim()).filter(url => url),
      features: formData.features.split(',').map(feature => feature.trim()).filter(feature => feature),
      challenges: formData.challenges.split(',').map(challenge => challenge.trim()).filter(challenge => challenge),
      featured: formData.featured
    };

    try {
      const success = await onSave(workData);
      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-2xl font-bold text-slate-800">
              {initialData ? '编辑作品' : '添加作品'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {initialData ? '更新作品详细信息' : '展示你的新作品'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all flex items-center justify-center"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 基本信息 */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-slate-800 border-l-4 border-blue-500 pl-3">基本信息</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">标题 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="输入作品标题"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">分类 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="例如：Web开发"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">状态</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="active">进行中</option>
                    <option value="completed">已完成</option>
                    <option value="archived">已归档</option>
                  </select>
                </div>

                <div className="flex items-center space-x-3 pt-8">
                  <input
                    type="checkbox"
                    id="featured"
                    name="featured"
                    checked={formData.featured}
                    onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="featured" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                    设为精选作品
                  </label>
                </div>
              </div>
            </div>

            {/* 技术细节 */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-slate-800 border-l-4 border-purple-500 pl-3">技术细节</h4>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">标签</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  placeholder="React, TypeScript, Web开发 (用逗号分隔)"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">技术栈</label>
                <input
                  type="text"
                  name="technologies"
                  value={formData.technologies}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  placeholder="React, Node.js, MongoDB (用逗号分隔)"
                />
              </div>
            </div>

            {/* 链接与资源 */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-slate-800 border-l-4 border-green-500 pl-3">链接与资源</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">项目链接</label>
                  <div className="relative">
                    <i className="fas fa-link absolute left-4 top-3.5 text-slate-400"></i>
                    <input
                      type="url"
                      name="project_url"
                      value={formData.project_url}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">GitHub链接</label>
                  <div className="relative">
                    <i className="fab fa-github absolute left-4 top-3.5 text-slate-400"></i>
                    <input
                      type="url"
                      name="github_url"
                      value={formData.github_url}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                      placeholder="https://github.com/username/repo"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">封面图片 URL</label>
                <input
                  type="url"
                  name="cover_image"
                  value={formData.cover_image}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                  placeholder="https://example.com/cover.jpg"
                />
              </div>
            </div>

            {/* 详细内容 */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-slate-800 border-l-4 border-orange-500 pl-3">详细内容</h4>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">简短描述</label>
                <RichTextEditor
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  placeholder="请输入作品简短描述..."
                  height={200}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">完整内容</label>
                <RichTextEditor
                  value={formData.content}
                  onChange={handleContentChange}
                  placeholder="请输入作品详细内容..."
                  height={400}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">核心功能</label>
                <input
                  type="text"
                  name="features"
                  value={formData.features}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  placeholder="用户认证, 数据可视化 (用逗号分隔)"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">技术挑战</label>
                <input
                  type="text"
                  name="challenges"
                  value={formData.challenges}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  placeholder="性能优化, 复杂状态管理 (用逗号分隔)"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-white hover:border-slate-400 transition-all font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-lg shadow-blue-500/30 flex items-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                保存中...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                保存作品
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
