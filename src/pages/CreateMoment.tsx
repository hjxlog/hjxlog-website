import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, Eye, Send, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import PublicNav from '@/components/PublicNav';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { API_BASE_URL, apiRequest } from '@/config/api';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  alt_text?: string;
}

interface MomentForm {
  content: string;
  visibility: 'public' | 'private';
  images: ImageFile[];
}

export default function CreateMoment() {
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  const [form, setForm] = useState<MomentForm>({
    content: '',
    visibility: 'public',
    images: [],
  });
  const [isPreview, setIsPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // 检查认证状态
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  // 处理文件选择
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newImages: ImageFile[] = [];
    const maxFiles = 9 - form.images.length;
    const filesToProcess = Math.min(files.length, maxFiles);

    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];
      
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        toast.error(`文件 ${file.name} 不是有效的图片格式`);
        continue;
      }

      // 检查文件大小（15MB限制）
      if (file.size > 15 * 1024 * 1024) {
        toast.error(`文件 ${file.name} 超过15MB大小限制`);
        continue;
      }

      const imageFile: ImageFile = {
        id: Date.now().toString() + i,
        file,
        preview: URL.createObjectURL(file),
      };
      
      newImages.push(imageFile);
    }

    if (newImages.length > 0) {
      setForm(prev => ({
        ...prev,
        images: [...prev.images, ...newImages],
      }));
    }

    if (files.length > maxFiles) {
      toast.warning(`最多只能上传9张图片，已选择前${maxFiles}张`);
    }
  };

  // 处理拖拽上传
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // 删除图片
  const removeImage = (id: string) => {
    setForm(prev => {
      const imageToRemove = prev.images.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return {
        ...prev,
        images: prev.images.filter(img => img.id !== id),
      };
    });
  };

  // 更新图片alt文本
  const updateImageAlt = (id: string, alt_text: string) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.map(img => 
        img.id === id ? { ...img, alt_text } : img
      ),
    }));
  };



  // 提交动态
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.content.trim()) {
      toast.error('请输入动态内容');
      return;
    }

    try {
      setSubmitting(true);
      
      // 处理图片数据（移除文件上传功能）
      const uploadedImages = [];
      // 注意：由于移除了文件上传功能，这里不再处理本地文件
      // 如果需要图片功能，请使用外部图片URL

      // 创建动态
      const data = await apiRequest('/api/moments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: form.content,
          visibility: form.visibility,
          images: uploadedImages,
        }),
      });

      if (data.success) {
        toast.success('动态发布成功！');
        navigate('/moments');
      } else {
        toast.error(data.message || '发布失败');
      }
    } catch (error) {
      console.error('发布失败:', error);
      toast.error('发布失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 渲染动态内容（支持简单的Markdown）
  const renderContent = (content: string) => {
    let rendered = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
      .replace(/\n/g, '<br>');
    
    return <div dangerouslySetInnerHTML={{ __html: rendered }} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <PublicNav />
      
      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/moments')}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                返回动态列表
              </button>
              <h1 className="text-2xl font-bold text-gray-900">发布动态</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPreview(!isPreview)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4" />
                {isPreview ? '编辑' : '预览'}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 内容编辑区 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                {isPreview ? (
                  <div className="min-h-[200px]">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">预览</h3>
                    {form.content ? (
                      <div className="prose prose-gray max-w-none">
                        {renderContent(form.content)}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">暂无内容</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      动态内容
                    </label>
                    <textarea
                      value={form.content}
                      onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="分享你的想法...\n\n支持简单的Markdown格式：\n**粗体** *斜体* [链接](URL)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={8}
                      required
                    />
                    <div className="mt-2 text-sm text-gray-500">
                      支持 Markdown 格式：**粗体**、*斜体*、[链接](URL)
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 图片上传区 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">图片 ({form.images.length}/9)</h3>
                
                {/* 图片网格 */}
                {form.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {form.images.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.preview}
                          alt={image.alt_text || '上传的图片'}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <input
                          type="text"
                          placeholder="图片描述（可选）"
                          value={image.alt_text || ''}
                          onChange={(e) => updateImageAlt(image.id, e.target.value)}
                          className="absolute bottom-2 left-2 right-2 px-2 py-1 text-xs bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* 上传区域 */}
                {form.images.length < 9 && (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragOver 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">拖拽图片到此处，或点击选择文件</p>
                    <p className="text-sm text-gray-500 mb-4">支持 JPG、PNG、GIF 格式，单个文件不超过 15MB</p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e.target.files)}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      选择图片
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* 发布设置 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">发布设置</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      可见性
                    </label>
                    <select
                      value={form.visibility}
                      onChange={(e) => setForm(prev => ({ ...prev, visibility: e.target.value as 'public' | 'private' }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="public">公开 - 所有人可见</option>
                      <option value="private">私密 - 仅自己可见</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/moments')}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting || !form.content.trim()}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
                {submitting ? '发布中...' : '发布动态'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}