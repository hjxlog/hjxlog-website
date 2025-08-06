import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// 移除对lib/api的依赖，直接调用服务器API
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { apiRequest } from '../config/api';
import { 
  ArrowLeftIcon,
  EyeIcon,
  DocumentTextIcon,
  TagIcon,
  FolderIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface BlogFormData {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  published: boolean;
  featured: boolean;
  cover_image: string;
  author: string;
}

const BlogEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    tags: [],
    published: false,
    featured: false,
    cover_image: '',
    author: 'Admin'
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 预定义的分类选项
  const categories = [
    'Technology',
    'React',
    'JavaScript',
    'CSS',
    'Node.js',
    'TypeScript',
    'Web Development',
    'Tutorial',
    'Tips & Tricks'
  ];

  // 加载博客数据（编辑模式）
  useEffect(() => {
    if (isEditing && id) {
      loadBlog();
    }
  }, [id, isEditing]);

  const loadBlog = async () => {
    setLoading(true);
    try {
      const blog = await apiRequest(`/api/blogs/${id}`);
      setFormData({
        title: blog.title || '',
        content: blog.content || '',
        excerpt: blog.excerpt || '',
        category: blog.category || '',
        tags: blog.tags || [],
        published: blog.published || false,
        featured: blog.featured || false,
        cover_image: blog.cover_image || '',
        author: blog.author || 'Admin'
      });
    } catch (error) {
      console.error('加载博客失败:', error);
      toast.error('加载博客失败');
      navigate('/admin/blogs');
    } finally {
      setLoading(false);
    }
  };

  // 保存博客
  const handleSave = async (publish: boolean = false) => {
    if (!formData.title.trim()) {
      toast.error('请输入博客标题');
      return;
    }
    
    if (!formData.content.trim()) {
      toast.error('请输入博客内容');
      return;
    }

    setSaving(true);
    try {
      const blogData = {
        ...formData,
        published: publish,
        excerpt: formData.excerpt || formData.content.substring(0, 200) + '...'
      };

      if (isEditing) {
        await apiRequest(`/api/blogs/${id}`, {
          method: 'PUT',
          body: JSON.stringify(blogData)
        });
        toast.success('博客更新成功');
      } else {
        await apiRequest('/api/blogs', {
          method: 'POST',
          body: JSON.stringify(blogData)
        });
        toast.success('博客创建成功');
        navigate('/admin/blogs');
      }
    } catch (error) {
      console.error('保存博客失败:', error);
      toast.error('保存博客失败');
    } finally {
      setSaving(false);
    }
  };

  // 添加标签
  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  // 删除标签
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="正在加载博客数据..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部工具栏 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/blogs')}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {isEditing ? '编辑博客' : '新建博客'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  previewMode ? 'bg-gray-100' : ''
                }`}
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                {previewMode ? '编辑' : '预览'}
              </button>
              
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存草稿'}
              </button>
              
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? '发布中...' : '发布'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 主编辑区域 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              {!previewMode ? (
                <div className="p-6">
                  {/* 标题输入 */}
                  <div className="mb-6">
                    <input
                      type="text"
                      placeholder="输入博客标题..."
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full text-3xl font-bold border-none outline-none placeholder-gray-400 resize-none"
                    />
                  </div>

                  {/* 摘要输入 */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      摘要 (可选)
                    </label>
                    <textarea
                      placeholder="输入博客摘要..."
                      value={formData.excerpt}
                      onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {/* 内容编辑器 */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      内容
                    </label>
                    <textarea
                      placeholder="开始写作..."
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      rows={20}
                      className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      支持 Markdown 语法
                    </p>
                  </div>
                </div>
              ) : (
                /* 预览模式 */
                <div className="p-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {formData.title || '无标题'}
                  </h1>
                  
                  {formData.excerpt && (
                    <div className="text-lg text-gray-600 mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-indigo-500">
                      {formData.excerpt}
                    </div>
                  )}
                  
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap font-sans">
                      {formData.content || '暂无内容'}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 侧边栏 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 发布状态 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                发布状态
              </h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="published"
                    checked={formData.published}
                    onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <label htmlFor="published" className="ml-2 text-sm text-gray-700">
                    立即发布
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <label htmlFor="featured" className="ml-2 text-sm text-gray-700">
                    设为精选
                  </label>
                </div>
                <div className="text-sm text-gray-500 flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {isEditing ? '最后更新' : '创建时间'}: {new Date().toLocaleDateString('zh-CN')}
                </div>
              </div>
            </div>

            {/* 分类选择 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FolderIcon className="h-5 w-5 mr-2" />
                分类
              </h3>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">选择分类</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* 封面图片 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">封面图片</h3>
              <input
                type="url"
                placeholder="输入图片URL"
                value={formData.cover_image}
                onChange={(e) => setFormData(prev => ({ ...prev, cover_image: e.target.value }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {formData.cover_image && (
                <div className="mt-4">
                  <img
                    src={formData.cover_image}
                    alt="封面预览"
                    className="w-full h-32 object-cover rounded-md"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* 标签管理 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <TagIcon className="h-5 w-5 mr-2" />
                标签
              </h3>
              
              {/* 添加标签 */}
              <div className="flex mb-4">
                <input
                  type="text"
                  placeholder="添加标签"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <button
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  添加
                </button>
              </div>

              {/* 标签列表 */}
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-indigo-600 hover:text-indigo-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 作者信息 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">作者</h3>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogEditor;