import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { apiRequest } from '../config/api';
import {
  ArrowPathIcon,
  TrashIcon,
  DocumentTextIcon,
  BeakerIcon,
  CubeIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface Stats {
  total: number;
  byType: Record<string, { items: number; chunks: number }>;
  lastUpdated: string | null;
}

interface KnowledgeItem {
  id: number;
  source_type: string;
  source_id: number;
  title: string;
  content_preview: string;
  metadata: unknown;
  created_at: string;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const KnowledgeBase: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'list'>('overview');

  // 获取统计信息
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest('/api/knowledge-base/stats');
      setStats(res.data);
    } catch (err) {
      console.error('获取知识库状态失败:', err);
      const message = err instanceof Error ? err.message : '获取知识库状态失败';
      setError(message);
      toast.error('获取知识库状态失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取列表
  const fetchList = useCallback(async () => {
    setError(null);
    try {
      const res = await apiRequest('/api/knowledge-base/list?limit=50');
      setItems(res.data);
    } catch (err) {
      console.error('获取知识库列表失败:', err);
      const message = err instanceof Error ? err.message : '获取知识库列表失败';
      setError(message);
      toast.error('获取知识库列表失败');
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'list') {
      fetchList();
    }
  }, [activeTab, fetchList]);

  // 重建知识库
  const handleRebuild = useCallback(async () => {
    if (!confirm('确定要重建知识库吗？这将清空现有数据并重新生成所有向量。\n\n注意：重建过程可能需要较长时间，请耐心等待。')) {
      return;
    }

    setRebuilding(true);
    setError(null);

    try {
      await apiRequest('/api/knowledge-base/rebuild-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogs: true, works: true }),
      });

      toast.success('知识库重建成功！');
      await fetchStats();
    } catch (err) {
      const message = err instanceof Error ? err.message : '重建失败';
      setError(message);
      toast.error('重建失败');
    } finally {
      setRebuilding(false);
    }
  }, [fetchStats]);

  // 删除单项
  const handleDeleteItem = useCallback(async (id: number) => {
    if (!confirm('确定要删除这个文档块吗？')) {
      return;
    }

    try {
      const item = items.find(i => i.id === id);
      if (!item) return;

      const endpoint = item.source_type === 'blog'
        ? `/api/knowledge-base/blog/${item.source_id}`
        : `/api/knowledge-base/work/${item.source_id}`;

      await apiRequest(endpoint, { method: 'DELETE' });

      toast.success('删除成功');
      fetchList();
      fetchStats();
    } catch {
      toast.error('删除失败');
    }
  }, [fetchList, fetchStats, items]);

  const itemsWithDate = useMemo(
    () => items.map((item) => ({
      ...item,
      dateLabel: formatDate(item.created_at),
    })),
    [items]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="正在加载..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">知识库管理</h1>
              <p className="mt-1 text-sm text-gray-500">
                管理 AI 助手的向量知识库
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchStats}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 错误提示 */}
        {error && (
          <div className="mb-6">
            <ErrorMessage
              message={error}
              onRetry={fetchStats}
              onDismiss={() => setError(null)}
            />
          </div>
        )}

        {/* 标签页 */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              概览
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`${
                activeTab === 'list'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              文档列表
            </button>
          </nav>
        </div>

        {activeTab === 'overview' && stats && (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* 文档总数 */}
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

              {/* 博客文档 */}
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

              {/* 作品文档 */}
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
          </>
        )}

        {activeTab === 'list' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                文档列表 ({items.length} 个)
              </h3>
            </div>
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
                      内容预览
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
                  {itemsWithDate.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                        <div className="text-sm text-gray-500">
                          ID: {item.source_id}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-md truncate">
                          {item.content_preview}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.dateLabel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {items.length === 0 && (
                <div className="text-center py-12">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">暂无文档</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;
