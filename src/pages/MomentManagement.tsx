import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PencilIcon, TrashIcon, EyeIcon, PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { apiRequest } from '@/config/api';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface Moment {
  id: number;
  content: string;
  images: string[];
  visibility: 'public' | 'private';
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  data?: {
    moments: Moment[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}

const MomentManagement: React.FC = () => {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    content: '',
    onConfirm: () => {}
  });

  // 获取动态列表
  const fetchMoments = async (currentPage: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const result: ApiResponse = await apiRequest(
        `/api/moments?page=${currentPage}&limit=${limit}&include_private=true`
      );
      
      if (result.success && result.data) {
        setMoments(result.data.moments);
        setTotal(result.data.total);
        setPage(result.data.page);
      } else {
        throw new Error(result.message || '获取动态列表失败');
      }
    } catch (err) {
      console.error('获取动态列表失败:', err);
      setError(err instanceof Error ? err.message : '获取动态列表失败');
      toast.error('获取动态列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除动态
  const handleDelete = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: '删除动态',
      content: '确定要删除这条动态吗？此操作不可恢复。',
      onConfirm: async () => {
        try {
          setDeleteLoading(id);
          
          const result = await apiRequest(`/api/moments/${id}`, {
            method: 'DELETE',
          });
          
          if (result.success) {
            toast.success('动态删除成功');
            // 重新获取当前页数据
            fetchMoments(page);
          } else {
            throw new Error(result.message || '删除动态失败');
          }
        } catch (err) {
          console.error('删除动态失败:', err);
          toast.error(err instanceof Error ? err.message : '删除动态失败');
        } finally {
          setDeleteLoading(null);
        }
        setConfirmDialog({ isOpen: false, title: '', content: '', onConfirm: () => {} });
      }
    });
  };

  // 格式化时间
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 截取内容
  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // 计算总页数
  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    fetchMoments(1);
  }, []);

  if (loading && moments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => fetchMoments(page)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题和操作 */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">动态管理</h1>
              <p className="mt-2 text-gray-600">管理所有动态内容</p>
            </div>
            <Link
              to="/moments/create"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              发布新动态
            </Link>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{total}</div>
              <div className="text-gray-600">总动态数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {moments.filter(m => m.visibility === 'public').length}
              </div>
              <div className="text-gray-600">公开动态</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {moments.filter(m => m.visibility === 'private').length}
              </div>
              <div className="text-gray-600">私密动态</div>
            </div>
          </div>
        </div>

        {/* 动态列表 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {moments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">暂无动态</p>
              <Link
                to="/moments/create"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                发布第一条动态
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      内容
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      图片
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      可见性
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      互动数据
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      创建时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {moments.map((moment) => (
                    <tr key={moment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {truncateContent(moment.content)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {moment.images.length > 0 ? (
                            <div className="flex -space-x-2">
                              {moment.images.slice(0, 3).map((image, index) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`图片 ${index + 1}`}
                                  className="h-8 w-8 rounded-full border-2 border-white object-cover"
                                />
                              ))}
                              {moment.images.length > 3 && (
                                <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                                  +{moment.images.length - 3}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">无图片</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            moment.visibility === 'public'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {moment.visibility === 'public' ? '公开' : '私密'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div>❤️ {moment.likes_count}</div>
                          <div>💬 {moment.comments_count}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(moment.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/moments/${moment.id}`}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="查看详情"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </Link>
                          <Link
                            to={`/moments/${moment.id}/edit`}
                            className="text-green-600 hover:text-green-800 transition-colors"
                            title="编辑"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(moment.id)}
                            disabled={deleteLoading === moment.id}
                            className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                            title="删除"
                          >
                            {deleteLoading === moment.id ? (
                              <div className="animate-spin h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full"></div>
                            ) : (
                              <TrashIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchMoments(page - 1)}
                disabled={page <= 1 || loading}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              
              <span className="px-3 py-2 text-sm text-gray-700">
                第 {page} 页，共 {totalPages} 页
              </span>
              
              <button
                onClick={() => fetchMoments(page + 1)}
                disabled={page >= totalPages || loading}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )})}}
      </div>
      
      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        content={confirmDialog.content}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, title: '', content: '', onConfirm: () => {} })}
      />
    </div>
  );
};

export default MomentManagement;