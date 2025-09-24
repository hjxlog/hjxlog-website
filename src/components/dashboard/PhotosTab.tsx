import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL, apiRequest } from '@/config/api';
import { uploadImageToOSS, deleteImageFromOSS, extractFileNameFromUrl } from '@/utils/ossUpload';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface Photo {
  id: number;
  title: string;
  description?: string;
  image_url: string;
  thumbnail_url?: string;
  category: string;
  location?: string;
  taken_at?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

interface PhotosTabProps {
  // 可以添加需要的props
}

export default function PhotosTab({}: PhotosTabProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState<Photo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const photosPerPage = 12;

  // 表单数据
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    thumbnail_url: '',
    category: '',
    location: '',
    taken_at: '',
    published: false
  });

  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // 获取照片列表
  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/photos?limit=1000`);
      const result = await response.json();
      if (result.success) {
        setPhotos(result.data.photos || []);
      } else {
        toast.error('获取照片列表失败');
      }
    } catch (error) {
      console.error('获取照片列表失败:', error);
      toast.error('获取照片列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除照片
  const deletePhoto = async (id: number) => {
    try {
      const result = await apiRequest(`/api/photos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (result.success) {
        toast.success('照片删除成功');
        fetchPhotos();
      } else {
        toast.error('删除失败，请稍后重试');
      }
    } catch (error) {
      console.error('删除照片失败:', error);
      toast.error('网络错误，请稍后重试');
    }
  };

  // 批量删除照片
  const batchDeletePhotos = async (ids: number[]) => {
    try {
      const result = await apiRequest('/api/photos', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ids })
      });

      if (result.success) {
        toast.success(`成功删除 ${ids.length} 张照片`);
        fetchPhotos();
        setSelectedPhotos([]);
      } else {
        toast.error('批量删除失败，请稍后重试');
      }
    } catch (error) {
      console.error('批量删除失败:', error);
      toast.error('网络错误，请稍后重试');
    }
  };

  // 处理图片上传
  const handleImageUpload = async (file: File) => {
    try {
      setIsUploading(true);
      console.log('🔍 [前端] 开始上传图片:', file.name);
      const result = await uploadImageToOSS(file);
      console.log('🔍 [前端] 上传结果:', result);
      if (result.success) {
        console.log('🔍 [前端] 设置图片URL:', result.url);
        setFormData(prev => {
          const newFormData = {
            ...prev,
            image_url: result.url,
            thumbnail_url: result.url // 可以后续优化为缩略图
          };
          console.log('🔍 [前端] 更新后的formData:', newFormData);
          return newFormData;
        });
        toast.success('图片上传成功！请填写标题后提交');
        // 自动聚焦到标题输入框
        setTimeout(() => {
          titleInputRef.current?.focus();
        }, 100);
      } else {
        console.error('🔍 [前端] 上传失败:', result);
        toast.error('图片上传失败');
      }
    } catch (error) {
      console.error('🔍 [前端] 图片上传异常:', error);
      toast.error('图片上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 [前端] 提交表单，当前formData:', formData);
    console.log('🔍 [前端] 标题:', formData.title.trim());
    console.log('🔍 [前端] 图片URL:', formData.image_url);
    
    if (!formData.title.trim() || !formData.image_url) {
      console.error('🔍 [前端] 验证失败: 标题或图片URL为空');
      toast.error('请填写标题并上传图片');
      return;
    }

    try {
      const photoData = {
        ...formData,
        taken_at: formData.taken_at || null
      };
      
      console.log('🔍 [前端] 准备发送的数据:', photoData);

      const url = currentPhoto ? `/api/photos/${currentPhoto.id}` : '/api/photos';
      const method = currentPhoto ? 'PUT' : 'POST';
      
      console.log('🔍 [前端] 请求URL:', url, '方法:', method);

      const result = await apiRequest(url, {
        method,
        body: JSON.stringify(photoData)
      });
      
      console.log('🔍 [前端] 服务器响应:', result);

      if (result.success) {
        toast.success(currentPhoto ? '照片更新成功' : '照片创建成功');
        closeForm();
        fetchPhotos();
      } else {
        console.error('🔍 [前端] 服务器返回错误:', result.message);
        toast.error(result.message || '操作失败，请稍后重试');
      }
    } catch (error) {
      console.error('🔍 [前端] 提交异常:', error);
      toast.error('网络错误，请稍后重试');
    }
  };

  // 打开表单
  const openForm = (photo?: Photo) => {
    if (photo) {
      setCurrentPhoto(photo);
      setFormData({
        title: photo.title,
        description: photo.description || '',
        image_url: photo.image_url,
        thumbnail_url: photo.thumbnail_url || '',
        category: photo.category,
        location: photo.location || '',
        taken_at: photo.taken_at ? photo.taken_at.split('T')[0] : '',
        published: photo.published
      });
    } else {
      setCurrentPhoto(null);
      setFormData({
        title: '',
        description: '',
        image_url: '',
        thumbnail_url: '',
        category: '',
        location: '',
        taken_at: '',
        published: false
      });
    }
    setIsFormOpen(true);
  };

  // 关闭表单
  const closeForm = () => {
    setIsFormOpen(false);
    setCurrentPhoto(null);
  };

  // 筛选和搜索
  const filteredPhotos = photos.filter(photo => {
    const matchesSearch = photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         photo.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || photo.category === selectedCategory;
    const matchesStatus = !selectedStatus || 
                         (selectedStatus === 'published' && photo.published) ||
                         (selectedStatus === 'draft' && !photo.published);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // 分页
  const totalPages = Math.ceil(filteredPhotos.length / photosPerPage);
  const currentPhotos = filteredPhotos.slice(
    (currentPage - 1) * photosPerPage,
    currentPage * photosPerPage
  );

  // 获取分类列表
  const categories = Array.from(new Set(photos.map(photo => photo.category).filter(Boolean)));

  // 批量选择状态
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // 处理全选
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos(currentPhotos.map(photo => photo.id));
    }
    setSelectAll(!selectAll);
  };

  // 处理单选
  const handleSelectPhoto = (id: number) => {
    setSelectedPhotos(prev => 
      prev.includes(id) 
        ? prev.filter(photoId => photoId !== id)
        : [...prev, id]
    );
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  useEffect(() => {
    setSelectAll(selectedPhotos.length === currentPhotos.length && currentPhotos.length > 0);
  }, [selectedPhotos, currentPhotos]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#165DFF]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作按钮 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">摄影管理</h2>
          <p className="text-slate-600 mt-1">管理您的摄影作品</p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedPhotos.length > 0 && (
            <button
              onClick={() => {
                setConfirmDialog({
                  isOpen: true,
                  title: '批量删除照片',
                  message: `确定要删除选中的 ${selectedPhotos.length} 张照片吗？此操作无法撤销。`,
                  onConfirm: () => {
                    batchDeletePhotos(selectedPhotos);
                    setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
                  }
                });
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              删除选中 ({selectedPhotos.length})
            </button>
          )}
          <button
            onClick={() => openForm()}
            className="px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-[#165DFF]/90 transition-colors flex items-center"
          >
            <i className="fas fa-plus mr-2"></i>
            添加照片
          </button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="搜索照片..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
            />
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
            >
              <option value="">所有分类</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
            >
              <option value="">所有状态</option>
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
            </select>
          </div>
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
                className="mr-2"
              />
              全选当前页
            </label>
          </div>
        </div>
      </div>

      {/* 照片网格 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        {currentPhotos.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-images text-4xl text-slate-300 mb-4"></i>
            <p className="text-slate-500">暂无照片</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {currentPhotos.map((photo) => (
              <div key={photo.id} className="relative group bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedPhotos.includes(photo.id)}
                    onChange={() => handleSelectPhoto(photo.id)}
                    className="w-4 h-4"
                  />
                </div>
                
                <div className="aspect-square overflow-hidden">
                  <img
                    src={photo.thumbnail_url || photo.image_url}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                <div className="p-3">
                  <h3 className="font-medium text-slate-800 truncate">{photo.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{photo.category}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      photo.published 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {photo.published ? '已发布' : '草稿'}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openForm(photo)}
                        className="p-1 text-slate-400 hover:text-[#165DFF] transition-colors"
                        title="编辑"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => {
                          setConfirmDialog({
                            isOpen: true,
                            title: '删除照片',
                            message: '确定要删除这张照片吗？此操作无法撤销。',
                            onConfirm: () => {
                              deletePhoto(photo.id);
                              setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
                            }
                          });
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        title="删除"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
          >
            上一页
          </button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-[#165DFF] text-white'
                    : 'border border-slate-300 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
          >
            下一页
          </button>
        </div>
      )}

      {/* 照片表单模态框 */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-slate-800">
                  {currentPhoto ? '编辑照片' : '添加照片'}
                </h3>
                <button
                  onClick={closeForm}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      标题 * <span className="text-slate-500 text-xs">(上传图片后请填写标题)</span>
                    </label>
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                      placeholder="请输入照片标题"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      描述
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      分类
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                      placeholder="如：风景、人像、街拍等"
                    />
                  </div>



                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      拍摄地点
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      拍摄时间
                    </label>
                    <input
                      type="date"
                      value={formData.taken_at}
                      onChange={(e) => setFormData({...formData, taken_at: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      照片 *
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                      {formData.image_url ? (
                        <div className="space-y-4">
                          <img
                            src={formData.image_url}
                            alt="预览"
                            className="max-h-48 mx-auto rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, image_url: '', thumbnail_url: ''})}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            删除图片
                          </button>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(file);
                              }
                            }}
                            className="hidden"
                            id="photo-upload"
                            disabled={isUploading}
                          />
                          <label htmlFor="photo-upload" className="cursor-pointer">
                            <div className="text-slate-400 mb-2 text-4xl">
                              {isUploading ? '⏳' : '📷'}
                            </div>
                            <p className="text-slate-600">
                              {isUploading ? '正在上传...' : '点击选择图片'}
                            </p>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.published}
                        onChange={(e) => setFormData({...formData, published: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-slate-700">立即发布</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || !formData.title.trim() || !formData.image_url}
                    className="px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-[#165DFF]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentPhoto ? '更新照片' : '添加照片'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
      />
    </div>
  );
}