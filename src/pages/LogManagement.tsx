import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthContext } from '@/contexts/authContext';
import { apiRequest } from '@/config/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import Empty from '@/components/Empty';

interface SystemLog {
  id: number;
  log_type: 'operation' | 'error' | 'security' | 'system';
  level: 'info' | 'warn' | 'error' | 'debug';
  module: string;
  action: string;
  description: string;
  user_id?: number;
  ip_address?: string;
  user_agent?: string;
  request_data?: unknown;
  response_data?: unknown;
  error_message?: string;
  execution_time?: number;
  created_at: string;
  username?: string;
}

interface ViewLogItem {
  id: number;
  target_type: string;
  target_id: number;
  ip_address: string;
  ip_location?: string | null;
  user_agent?: string | null;
  path?: string | null;
  created_at: string;
  ip_quality?: string | null;
  is_bot?: boolean | null;
  accepted?: boolean | null;
}

interface ViewInsights {
  summary: {
    totalViews: number;
    uniqueIps: number;
    todayViews: number;
    yesterdayViews: number;
  };
  regions: Array<{ location: string; count: number; ratio: number }>;
  contentHotspots: Array<{ targetType: string; targetId: number; count: number; ratio: number }>;
  pathHotspots: Array<{ path: string; count: number; ratio: number }>;
}

interface DateRange {
  start: string;
  end: string;
}

function getDefaultLast7Days(): DateRange {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10)
  };
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function formatExecutionTime(time: number | undefined) {
  if (!time) return '-';
  if (time < 1000) return `${time}ms`;
  return `${(time / 1000).toFixed(2)}s`;
}

function getLogTypeStyle(type: string) {
  switch (type) {
    case 'error':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'security':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'operation':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'system':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getLevelStyle(level: string) {
  switch (level) {
    case 'error':
      return 'bg-red-50 text-red-700';
    case 'warn':
      return 'bg-yellow-50 text-yellow-700';
    case 'info':
      return 'bg-blue-50 text-blue-700';
    case 'debug':
      return 'bg-gray-50 text-gray-700';
    default:
      return 'bg-gray-50 text-gray-700';
  }
}

function getMethodStyle(action: string) {
  const method = action.split(' ')[0];
  switch (method) {
    case 'GET':
      return 'bg-green-100 text-green-800';
    case 'POST':
      return 'bg-blue-100 text-blue-800';
    case 'PUT':
      return 'bg-yellow-100 text-yellow-800';
    case 'DELETE':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getTargetTypeLabel(targetType: string) {
  const mapper: Record<string, string> = {
    blog: '博客详情',
    moment: '动态详情',
    work: '作品详情',
    home_page: '首页',
    blogs_list: '博客列表',
    works_list: '作品列表',
    photos_page: '摄影页面'
  };
  return mapper[targetType] || targetType;
}

export default function LogManagement() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'system' | 'view'>('system');

  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ start: '', end: '' });
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<SystemLog | null>(null);

  const [viewLogs, setViewLogs] = useState<ViewLogItem[]>([]);
  const [viewLoading, setViewLoading] = useState(true);
  const [viewError, setViewError] = useState<string | null>(null);
  const [viewCurrentPage, setViewCurrentPage] = useState(1);
  const [viewTotalPages, setViewTotalPages] = useState(1);
  const [viewDateRange, setViewDateRange] = useState<DateRange>(getDefaultLast7Days);
  const [viewTargetType, setViewTargetType] = useState('');
  const [viewPath, setViewPath] = useState('');
  const [viewIpLocation, setViewIpLocation] = useState('');
  const [viewSearch, setViewSearch] = useState('');
  const [viewInsights, setViewInsights] = useState<ViewInsights | null>(null);
  const [viewInsightsLoading, setViewInsightsLoading] = useState(true);

  const logsPerPage = 20;

  const targetTypeOptions = useMemo(
    () => [
      { value: '', label: '全部类型' },
      { value: 'blog', label: '博客详情' },
      { value: 'work', label: '作品详情' },
      { value: 'moment', label: '动态详情' },
      { value: 'home_page', label: '首页' },
      { value: 'blogs_list', label: '博客列表' },
      { value: 'works_list', label: '作品列表' },
      { value: 'photos_page', label: '摄影页面' }
    ],
    []
  );

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: logsPerPage.toString(),
        sort: 'desc',
        ...(searchQuery && { search: searchQuery }),
        ...(selectedType && { log_type: selectedType }),
        ...(selectedModule && { module: selectedModule }),
        ...(dateRange.start && { start_date: dateRange.start }),
        ...(dateRange.end && { end_date: dateRange.end })
      });

      const response = await apiRequest(`/api/admin/logs?${params}`);
      if (response.success) {
        const list: SystemLog[] = response.data?.logs || [];
        const pagination = response.data?.pagination;
        const nextTotalPages = Number(pagination?.totalPages || 1);
        setLogs(list);
        setTotalPages(nextTotalPages > 0 ? nextTotalPages : 1);
        setError(null);
      } else {
        setError(response.message || '获取日志失败');
      }
    } catch (requestError) {
      console.error('获取日志失败:', requestError);
      setError('获取日志失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchViewLogs = async () => {
    try {
      setViewLoading(true);
      const params = new URLSearchParams({
        page: viewCurrentPage.toString(),
        limit: logsPerPage.toString(),
        ...(viewDateRange.start && { start_date: viewDateRange.start }),
        ...(viewDateRange.end && { end_date: viewDateRange.end }),
        ...(viewTargetType && { target_type: viewTargetType }),
        ...(viewPath && { path: viewPath }),
        ...(viewIpLocation && { ip_location: viewIpLocation }),
        ...(viewSearch && { search: viewSearch })
      });

      const response = await apiRequest(`/api/admin/view-logs?${params}`);
      if (response.success) {
        const list: ViewLogItem[] = response.data?.list || [];
        const pagination = response.data?.pagination;
        const nextTotalPages = Number(pagination?.totalPages || 1);
        setViewLogs(list);
        setViewTotalPages(nextTotalPages > 0 ? nextTotalPages : 1);
        setViewError(null);
      } else {
        setViewError(response.message || '获取访问日志失败');
      }
    } catch (requestError) {
      console.error('获取访问日志失败:', requestError);
      setViewError('获取访问日志失败');
    } finally {
      setViewLoading(false);
    }
  };

  const fetchViewInsights = async () => {
    try {
      setViewInsightsLoading(true);
      const params = new URLSearchParams({
        ...(viewDateRange.start && { start_date: viewDateRange.start }),
        ...(viewDateRange.end && { end_date: viewDateRange.end }),
        ...(viewTargetType && { target_type: viewTargetType }),
        ...(viewPath && { path: viewPath }),
        ...(viewIpLocation && { ip_location: viewIpLocation }),
        ...(viewSearch && { search: viewSearch })
      });

      const response = await apiRequest(`/api/admin/view-logs/insights?${params}`);
      if (response.success) {
        setViewInsights(response.data);
      } else {
        setViewInsights(null);
      }
    } catch (requestError) {
      console.error('获取访问洞察失败:', requestError);
      setViewInsights(null);
    } finally {
      setViewInsightsLoading(false);
    }
  };

  const handleCleanupLogs = async () => {
    if (!confirm('确定要清理30天前的日志吗？此操作不可恢复。')) return;

    try {
      const response = await apiRequest('/api/admin/logs/cleanup', {
        method: 'DELETE'
      });

      if (response.success) {
        toast.success(response.message || '日志清理完成');
        fetchLogs();
      } else {
        toast.error(response.message || '清理失败');
      }
    } catch (requestError) {
      console.error('清理日志失败:', requestError);
      toast.error('清理失败');
    }
  };

  const handleResetSystemFilters = () => {
    setSearchQuery('');
    setSelectedType('');
    setSelectedModule('');
    setDateRange({ start: '', end: '' });
    setCurrentPage(1);
  };

  const handleResetViewFilters = () => {
    setViewTargetType('');
    setViewPath('');
    setViewIpLocation('');
    setViewSearch('');
    setViewDateRange(getDefaultLast7Days());
    setViewCurrentPage(1);
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user || activeTab !== 'system') return;
    fetchLogs();
  }, [
    user,
    activeTab,
    currentPage,
    searchQuery,
    selectedType,
    selectedModule,
    dateRange.start,
    dateRange.end
  ]);

  useEffect(() => {
    if (!user || activeTab !== 'view') return;
    fetchViewLogs();
  }, [
    user,
    activeTab,
    viewCurrentPage,
    viewDateRange.start,
    viewDateRange.end,
    viewTargetType,
    viewPath,
    viewIpLocation,
    viewSearch
  ]);

  useEffect(() => {
    if (!user || activeTab !== 'view') return;
    fetchViewInsights();
  }, [
    user,
    activeTab,
    viewDateRange.start,
    viewDateRange.end,
    viewTargetType,
    viewPath,
    viewIpLocation,
    viewSearch
  ]);

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">系统日志管理</h1>
          <p className="mt-2 text-gray-600">查看系统日志与访问日志（view_logs）</p>
        </div>

        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('system')}
              className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
                activeTab === 'system'
                  ? 'text-blue-600 border-blue-600 bg-blue-50'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              系统日志
            </button>
            <button
              onClick={() => setActiveTab('view')}
              className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
                activeTab === 'view'
                  ? 'text-blue-600 border-blue-600 bg-blue-50'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              访问日志
            </button>
          </div>
        </div>

        {activeTab === 'system' && (
          <>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="space-y-4">
                <div className="flex flex-col space-y-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">搜索</label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="搜索操作或详情..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">日志类型</label>
                    <select
                      value={selectedType}
                      onChange={(e) => {
                        setSelectedType(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">全部类型</option>
                      <option value="operation">操作</option>
                      <option value="error">错误</option>
                      <option value="security">安全</option>
                      <option value="system">系统</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">模块</label>
                    <select
                      value={selectedModule}
                      onChange={(e) => {
                        setSelectedModule(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">全部模块</option>
                      <option value="auth">认证</option>
                      <option value="blog">博客</option>
                      <option value="work">作品</option>
                      <option value="moment">动态</option>
                      <option value="upload">上传</option>
                      <option value="server">服务器</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col space-y-4 lg:flex-row lg:items-end lg:gap-4 lg:space-y-0">
                  <div className="lg:w-80">
                    <label className="block text-sm font-medium text-gray-700 mb-2">日期范围</label>
                    <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => {
                          setDateRange((prev) => ({ ...prev, start: e.target.value }));
                          setCurrentPage(1);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => {
                          setDateRange((prev) => ({ ...prev, end: e.target.value }));
                          setCurrentPage(1);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 lg:flex-row lg:space-y-0 lg:space-x-2 lg:flex-shrink-0">
                    <button
                      onClick={handleResetSystemFilters}
                      className="w-full lg:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium"
                    >
                      重置筛选
                    </button>
                    <button
                      onClick={handleCleanupLogs}
                      className="w-full lg:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium"
                    >
                      清理过期日志
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {loading ? (
                <div className="p-8">
                  <LoadingSpinner />
                </div>
              ) : error ? (
                <div className="p-8">
                  <ErrorMessage message={error} />
                </div>
              ) : logs.length === 0 ? (
                <div className="p-8">
                  <Empty message="暂无日志数据" />
                </div>
              ) : (
                <>
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">日志列表 ({logs.length} 条)</h3>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {logs.map((log) => (
                      <div key={log.id} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2 gap-2">
                              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getLogTypeStyle(log.log_type)}`}>
                                  {log.log_type.toUpperCase()}
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded ${getLevelStyle(log.level)}`}>
                                  {log.level.toUpperCase()}
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded ${getMethodStyle(log.action)}`}>
                                  {log.action.split(' ')[0]}
                                </span>
                                <span className="text-sm font-medium text-gray-900 hidden sm:inline">{log.module}</span>
                                <span className="text-sm text-gray-500 hidden md:inline">{formatTime(log.created_at)}</span>
                                {log.execution_time && (
                                  <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded hidden lg:inline">
                                    {formatExecutionTime(log.execution_time)}
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={() => setSelectedLogForDetail(log)}
                                className="text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 text-sm whitespace-nowrap"
                                title="查看详情"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                            </div>

                            <div className="mb-2">
                              <p className="text-sm text-gray-900 font-medium break-words">{log.action}</p>
                              <p className="text-sm text-gray-600 mt-1 break-words">{log.description}</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                              {log.username && <span>用户: {log.username}</span>}
                              {log.ip_address && <span>IP: {log.ip_address}</span>}
                              {log.user_agent && <span className="truncate max-w-full" title={log.user_agent}>UA: {log.user_agent}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                      <div className="text-sm text-gray-700">第 {currentPage} 页，共 {totalPages} 页</div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50"
                        >
                          上一页
                        </button>
                        <button
                          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50"
                        >
                          下一页
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {activeTab === 'view' && (
          <>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">关键词</label>
                  <input
                    type="text"
                    value={viewSearch}
                    onChange={(e) => {
                      setViewSearch(e.target.value);
                      setViewCurrentPage(1);
                    }}
                    placeholder="路径/IP/地区/UA"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">目标类型</label>
                  <select
                    value={viewTargetType}
                    onChange={(e) => {
                      setViewTargetType(e.target.value);
                      setViewCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {targetTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">路径包含</label>
                  <input
                    type="text"
                    value={viewPath}
                    onChange={(e) => {
                      setViewPath(e.target.value);
                      setViewCurrentPage(1);
                    }}
                    placeholder="如 /blog"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">地区包含</label>
                  <input
                    type="text"
                    value={viewIpLocation}
                    onChange={(e) => {
                      setViewIpLocation(e.target.value);
                      setViewCurrentPage(1);
                    }}
                    placeholder="如 广东"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">开始日期</label>
                    <input
                      type="date"
                      value={viewDateRange.start}
                      onChange={(e) => {
                        setViewDateRange((prev) => ({ ...prev, start: e.target.value }));
                        setViewCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">结束日期</label>
                    <input
                      type="date"
                      value={viewDateRange.end}
                      onChange={(e) => {
                        setViewDateRange((prev) => ({ ...prev, end: e.target.value }));
                        setViewCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleResetViewFilters}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium"
                >
                  重置访问日志筛选
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">访问概况</h4>
                {viewInsightsLoading ? (
                  <div className="py-4"><LoadingSpinner /></div>
                ) : !viewInsights ? (
                  <Empty message="暂无统计数据" />
                ) : (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-gray-500">总访问</p>
                      <p className="text-lg font-semibold text-gray-900">{viewInsights.summary.totalViews}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-gray-500">独立IP</p>
                      <p className="text-lg font-semibold text-gray-900">{viewInsights.summary.uniqueIps}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-gray-500">今日</p>
                      <p className="text-lg font-semibold text-gray-900">{viewInsights.summary.todayViews}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-gray-500">昨日</p>
                      <p className="text-lg font-semibold text-gray-900">{viewInsights.summary.yesterdayViews}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">地区来源分布</h4>
                {viewInsightsLoading ? (
                  <div className="py-4"><LoadingSpinner /></div>
                ) : !viewInsights || viewInsights.regions.length === 0 ? (
                  <Empty message="暂无地区数据" />
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {viewInsights.regions.map((item) => (
                      <div key={item.location} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 truncate pr-2" title={item.location}>{item.location}</span>
                        <span className="text-gray-900 font-medium">{item.count} ({item.ratio}%)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">内容热度榜</h4>
                {viewInsightsLoading ? (
                  <div className="py-4"><LoadingSpinner /></div>
                ) : !viewInsights || viewInsights.contentHotspots.length === 0 ? (
                  <Empty message="暂无内容热度数据" />
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {viewInsights.contentHotspots.map((item) => (
                      <div key={`${item.targetType}-${item.targetId}`} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 truncate pr-2" title={`${item.targetType}:${item.targetId}`}>
                          {getTargetTypeLabel(item.targetType)} #{item.targetId}
                        </span>
                        <span className="text-gray-900 font-medium">{item.count} ({item.ratio}%)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">路径热榜</h4>
              {viewInsightsLoading ? (
                <div className="py-4"><LoadingSpinner /></div>
              ) : !viewInsights || viewInsights.pathHotspots.length === 0 ? (
                <Empty message="暂无路径热度数据" />
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {viewInsights.pathHotspots.map((item) => (
                    <div key={item.path} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 truncate pr-2" title={item.path}>{item.path}</span>
                      <span className="text-gray-900 font-medium">{item.count} ({item.ratio}%)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {viewLoading ? (
                <div className="p-8"><LoadingSpinner /></div>
              ) : viewError ? (
                <div className="p-8"><ErrorMessage message={viewError} /></div>
              ) : viewLogs.length === 0 ? (
                <div className="p-8"><Empty message="暂无访问日志数据" /></div>
              ) : (
                <>
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">访问日志明细 ({viewLogs.length} 条)</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">时间</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">目标</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">路径</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">地区</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">IP</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">状态</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">UA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {viewLogs.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-gray-700">{formatTime(item.created_at)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                              {getTargetTypeLabel(item.target_type)} #{item.target_id}
                            </td>
                            <td className="px-4 py-3 text-gray-700 max-w-xs truncate" title={item.path || '-'}>{item.path || '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-700">{item.ip_location || '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-700">{item.ip_address || '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                              {item.is_bot === true ? 'Bot' : 'User'}
                              {item.ip_quality ? ` / ${item.ip_quality}` : ''}
                              {item.accepted !== null && item.accepted !== undefined ? (item.accepted ? ' / accepted' : ' / dropped') : ''}
                            </td>
                            <td className="px-4 py-3 text-gray-700 max-w-sm truncate" title={item.user_agent || '-'}>
                              {item.user_agent || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {viewTotalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                      <div className="text-sm text-gray-700">第 {viewCurrentPage} 页，共 {viewTotalPages} 页</div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setViewCurrentPage((prev) => Math.max(1, prev - 1))}
                          disabled={viewCurrentPage === 1}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50"
                        >
                          上一页
                        </button>
                        <button
                          onClick={() => setViewCurrentPage((prev) => Math.min(viewTotalPages, prev + 1))}
                          disabled={viewCurrentPage === viewTotalPages}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50"
                        >
                          下一页
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {selectedLogForDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">日志详情</h3>
              <button
                onClick={() => setSelectedLogForDetail(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">基本信息</h4>
                  <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>类型: {selectedLogForDetail.log_type}</div>
                    <div>级别: {selectedLogForDetail.level}</div>
                    <div>时间: {formatTime(selectedLogForDetail.created_at)}</div>
                    <div>模块: {selectedLogForDetail.module}</div>
                    <div>用户: {selectedLogForDetail.username || '未知用户'}</div>
                    <div>IP: {selectedLogForDetail.ip_address || '未知'}</div>
                    <div>执行时间: {formatExecutionTime(selectedLogForDetail.execution_time)}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">操作详情</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><span className="text-gray-600">操作:</span> {selectedLogForDetail.action}</p>
                    <p><span className="text-gray-600">描述:</span> {selectedLogForDetail.description}</p>
                  </div>
                </div>

                {selectedLogForDetail.user_agent && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">用户代理</h4>
                    <pre className="text-xs text-gray-700 bg-gray-50 p-4 rounded border overflow-x-auto whitespace-pre-wrap">
                      {selectedLogForDetail.user_agent}
                    </pre>
                  </div>
                )}

                {selectedLogForDetail.request_data && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">请求数据</h4>
                    <pre className="text-xs text-gray-700 bg-gray-50 p-4 rounded border overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(selectedLogForDetail.request_data, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLogForDetail.response_data && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">响应数据</h4>
                    <pre className="text-xs text-gray-700 bg-gray-50 p-4 rounded border overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(selectedLogForDetail.response_data, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLogForDetail.error_message && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">错误信息</h4>
                    <pre className="text-xs text-red-700 bg-red-50 p-4 rounded border overflow-x-auto whitespace-pre-wrap">
                      {selectedLogForDetail.error_message}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end p-4 sm:p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedLogForDetail(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
