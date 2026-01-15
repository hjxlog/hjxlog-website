import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiRequest } from '@/config/api';
import {
  ArrowPathIcon,
  TrashIcon,
  DocumentTextIcon,
  BeakerIcon,
  CubeIcon,
  ClockIcon,
  XMarkIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface Stats {
  total: number;
  byType: Record<string, { items: number; chunks: number }>;
  lastUpdated: string | null;
}

interface GroupedItem {
  source_type: string;
  source_id: number;
  title: string;
  source_title: string;
  category: string;
  chunk_count: number;
  created_at: string;
}

interface Chunk {
  id: number;
  title: string;
  content: string;
  metadata: any;
  created_at: string;
}

interface KnowledgeBaseTabProps {
  className?: string;
}

const KnowledgeBaseTab: React.FC<KnowledgeBaseTabProps> = ({ className = '' }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [items, setItems] = useState<GroupedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'list'>('overview');

  // 弹窗相关状态
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState<GroupedItem | null>(null);
  const [modalChunks, setModalChunks] = useState<Chunk[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/knowledge-base/stats');
      setStats(res.data);
    } catch (err: any) {
      console.error('获取知识库状态失败:', err);
      toast.error('获取知识库状态失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchList = async () => {
    try {
      console.log('开始获取知识库列表...');
      const res = await apiRequest('/api/knowledge-base/list?limit=50');
      console.log('获取知识库列表结果:', res);
      setItems(res.data || []);
    } catch (err: any) {
      console.error('获取知识库列表失败:', err);
      toast.error('获取知识库列表失败');
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'list') {
      fetchList();
    }
  }, [activeSubTab]);

  // 防止弹窗打开时背景滚动
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalOpen]);

  const handleRebuild = async () => {
    if (!confirm('确定要重建知识库吗？这将清空现有数据并重新生成所有向量。\n\n注意：重建过程可能需要较长时间，请耐心等待。')) {
      return;
    }

    setRebuilding(true);

    try {
      await apiRequest('/api/knowledge-base/rebuild-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogs: true, works: true }),
      });

      toast.success('知识库重建成功！');
      await fetchStats();
      if (activeSubTab === 'list') {
        fetchList();
      }
    } catch (err: any) {
      toast.error('重建失败');
    } finally {
      setRebuilding(false);
    }
  };

  const handleDeleteItem = async (sourceType: string, sourceId: number) => {
    if (!confirm('确定要删除这个文档的所有向量数据吗？')) {
      return;
    }

    try {
      const endpoint = sourceType === 'blog'
        ? `/api/knowledge-base/blog/${sourceId}`
        : `/api/knowledge-base/work/${sourceId}`;

      await apiRequest(endpoint, { method: 'DELETE' });

      toast.success('删除成功');
      fetchList();
      fetchStats();
    } catch (err: any) {
      toast.error('删除失败');
    }
  };

  const openModal = async (item: GroupedItem) => {
    setModalItem(item);
    setModalOpen(true);
    setModalLoading(true);

    try {
      const res = await apiRequest(`/api/knowledge-base/chunks/${item.source_type}/${item.source_id}`);
      setModalChunks(res.data || []);
    } catch (err: any) {
      console.error('获取 chunks 失败:', err);
      toast.error('获取详情失败');
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalItem(null);
    setModalChunks([]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* 标题和操作 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">知识库管理</h2>
          <p className="text-sm text-gray-500 mt-1">管理 AI 助手的向量知识库</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchStats}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            刷新
          </button>
          <button
            onClick={handleRebuild}
            disabled={rebuilding}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300"
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${rebuilding ? 'animate-spin' : ''}`} />
            {rebuilding ? '重建中...' : '重建知识库'}
          </button>
        </div>
      </div>

      {/* 子标签页 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`${
              activeSubTab === 'overview'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            概览
          </button>
          <button
            onClick={() => setActiveSubTab('list')}
            className={`${
              activeSubTab === 'list'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            文档列表
          </button>
        </nav>
      </div>

      {activeSubTab === 'overview' && stats && (
        <div className="min-h-[400px]">
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                    <DocumentTextIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-500">文档块总数</p>
                    <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <BeakerIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-500">博客</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {stats.byType.blog?.items || 0} 篇
                      <span className="text-sm text-gray-500 ml-2">
                        ({stats.byType.blog?.chunks || 0} 块)
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                    <CubeIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-500">作品</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {stats.byType.work?.items || 0} 个
                      <span className="text-sm text-gray-500 ml-2">
                        ({stats.byType.work?.chunks || 0} 块)
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 说明卡片 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-4">说明</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <p className="text-sm text-blue-800 flex-1">
                  知识库从已发布的博客和作品中自动生成向量嵌入
                </p>
              </div>
              <div className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <p className="text-sm text-blue-800 flex-1">
                  向量存储在 PostgreSQL 的 PGVector 扩展中（1024维）
                </p>
              </div>
              <div className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <p className="text-sm text-blue-800 flex-1">
                  点击"重建知识库"会重新生成所有向量数据
                </p>
              </div>
              {stats.lastUpdated && (
                <div className="flex items-start">
                  <ClockIcon className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    最近更新: {formatDate(stats.lastUpdated)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'list' && (
        <div className="bg-white shadow rounded-lg overflow-hidden min-h-[400px]">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              文档列表 ({items.length} 个)
            </h3>
          </div>

          {/* 表格列表 */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    类型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    标题
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    分块数量
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={`${item.source_type}-${item.source_id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        item.source_type === 'blog'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {item.source_type === 'blog' ? '博客' : '作品'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {item.title}
                      </div>
                      {item.category && (
                        <div className="text-xs text-gray-500 mt-1">
                          {item.category}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {item.chunk_count} 个分块
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openModal(item)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        查看详情
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.source_type, item.source_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {items.length === 0 && (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">暂无文档</p>
            </div>
          )}
        </div>
      )}

      {/* 详情弹窗 */}
      {modalOpen && modalItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            {/* 背景遮罩 */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={closeModal}
            ></div>

            {/* 弹窗内容 */}
            <div className="relative bg-white rounded-lg max-w-4xl w-full mx-auto shadow-xl transform transition-all">
              {/* 弹窗头部 */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-3 ${
                    modalItem.source_type === 'blog'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {modalItem.source_type === 'blog' ? '博客' : '作品'}
                  </span>
                  <h3 className="text-lg font-medium text-gray-900">
                    {modalItem.title}
                  </h3>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* 弹窗内容 */}
              <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
                {/* 元信息 */}
                <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">ID:</span>
                    <span className="ml-2 text-gray-900">{modalItem.source_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">分块数:</span>
                    <span className="ml-2 text-gray-900">{modalItem.chunk_count}</span>
                  </div>
                  {modalItem.category && (
                    <div>
                      <span className="text-gray-500">分类:</span>
                      <span className="ml-2 text-gray-900">{modalItem.category}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">创建时间:</span>
                    <span className="ml-2 text-gray-900">{formatDate(modalItem.created_at)}</span>
                  </div>
                </div>

                {/* Chunks 列表 */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">
                    文档分块详情
                  </h4>

                  {modalLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      <span className="ml-3 text-gray-600">加载中...</span>
                    </div>
                  ) : modalChunks.length > 0 ? (
                    <div className="space-y-3">
                      {modalChunks.map((chunk, index) => (
                        <div
                          key={chunk.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="text-sm font-medium text-gray-900">
                              {chunk.title}
                            </h5>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-gray-500 bg-gray-100">
                              #{index + 1}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">
                            {chunk.content}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>ID: {chunk.id}</span>
                            <span>{chunk.content.length} 字</span>
                            <span>{formatDate(chunk.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      暂无分块数据
                    </div>
                  )}
                </div>
              </div>

              {/* 弹窗底部 */}
              <div className="px-6 py-4 bg-gray-50 flex justify-end rounded-b-lg">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBaseTab;
