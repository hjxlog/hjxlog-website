import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { apiRequest } from '../config/api';
import {
  ArrowPathIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  BeakerIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';

interface Stats {
  total: number;
  by_source: Record<string, number>;
  last_updated: string | null;
}

const KnowledgeBase: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest('/api/chat/status');
      setStats(res.data);
    } catch (err: any) {
      console.error('获取知识库状态失败:', err);
      setError(err.message || '获取知识库状态失败');
      toast.error('获取知识库状态失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRebuild = async () => {
    if (!confirm('确定要重建知识库吗？这将清空现有数据并重新生成向量。\n\n注意：此功能需要服务器端运行初始化脚本：npm run ai:init')) {
      return;
    }

    setRebuilding(true);
    setError(null);

    try {
      // 提示用户手动运行脚本
      toast.info('请在服务器端运行: cd server && npm run ai:init');
      alert('请在服务器终端运行以下命令重建知识库：\n\ncd server && npm run ai:init\n\n完成后点击"刷新"按钮更新状态。');
    } catch (err: any) {
      setError(err.message || '操作失败');
      toast.error('操作失败');
    } finally {
      setRebuilding(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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

        {loading ? (
          <LoadingSpinner size="lg" text="正在加载知识库状态..." />
        ) : stats ? (
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
                      <p className="text-sm font-medium text-gray-500 truncate">文档总数</p>
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
                      <p className="text-sm font-medium text-gray-500 truncate">博客文档</p>
                      <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.by_source.blog || 0}</p>
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
                      <p className="text-sm font-medium text-gray-500 truncate">作品文档</p>
                      <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.by_source.work || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 操作卡片 */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">操作</h3>
              </div>
              <div className="px-6 py-5">
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handleRebuild}
                    disabled={rebuilding}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                    {rebuilding ? '处理中...' : '重建知识库'}
                  </button>
                  <button
                    onClick={fetchStats}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    刷新状态
                  </button>
                </div>
                {stats.last_updated && (
                  <p className="mt-4 text-sm text-gray-500">
                    最近更新: {formatDate(stats.last_updated)}
                  </p>
                )}
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
                    向量存储在 PostgreSQL 的 PGVector 扩展中（1024维，使用 embedding-2 模型）
                  </p>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <p className="text-sm text-blue-800 flex-1">
                    重建知识库需要在服务器端运行初始化脚本：<code className="bg-blue-100 px-1 py-0.5 rounded text-xs">npm run ai:init</code>
                  </p>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <p className="text-sm text-blue-800 flex-1">
                    AI 助手使用向量检索找到最相关的文档，然后通过智谱 GLM-4 模型生成回答
                  </p>
                </div>
              </div>
            </div>

            {/* 技术信息 */}
            <div className="mt-6 bg-white shadow rounded-lg">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">技术信息</h3>
              </div>
              <div className="px-6 py-5">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">向量数据库</dt>
                    <dd className="mt-1 text-sm text-gray-900">PostgreSQL + PGVector</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">嵌入模型</dt>
                    <dd className="mt-1 text-sm text-gray-900">智谱 embedding-2 (1024维)</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">语言模型</dt>
                    <dd className="mt-1 text-sm text-gray-900">智谱 GLM-4 Flash</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">流式传输</dt>
                    <dd className="mt-1 text-sm text-gray-900">Server-Sent Events (SSE)</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">检索策略</dt>
                    <dd className="mt-1 text-sm text-gray-900">Top 5 文档，余弦相似度阈值 0.3</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">文本分块</dt>
                    <dd className="mt-1 text-sm text-gray-900">最大500字，重叠50字</dd>
                  </div>
                </dl>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default KnowledgeBase;
