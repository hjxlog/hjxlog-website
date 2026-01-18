import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';

import { toast } from 'sonner';
import { API_BASE_URL, apiRequest } from '@/config/api';
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
  request_data?: any;
  response_data?: any;
  error_message?: string;
  execution_time?: number;
  created_at: string;
  username?: string;
}



export default function LogManagement() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [logs, setLogs] = useState<SystemLog[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 分页和筛选状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  // 默认按最新在前排序

  const [selectedLogForDetail, setSelectedLogForDetail] = useState<SystemLog | null>(null);
  const logsPerPage = 20;
  


  // 获取日志列表
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: logsPerPage.toString(),
        sort: 'desc', // 默认最新在前
        ...(searchQuery && { search: searchQuery }),
        ...(selectedType && { log_type: selectedType }),
        ...(selectedModule && { module: selectedModule }),
        ...(dateRange.start && { start_date: dateRange.start }),
        ...(dateRange.end && { end_date: dateRange.end })
      });

      const response = await apiRequest(`/api/admin/logs?${params}`);
      if (response.success) {
        setLogs(response.data.logs);
        setTotalPages(Math.ceil(response.data.total / logsPerPage));
      } else {
        setError(response.message || '获取日志失败');
      }
    } catch (error) {
      console.error('获取日志失败:', error);
      setError('获取日志失败');
    } finally {
      setLoading(false);
    }
  };



  // 清理过期日志
  const handleCleanupLogs = async () => {
    if (!confirm('确定要清理30天前的日志吗？此操作不可恢复。')) return;
    
    try {
      const response = await apiRequest('/api/admin/logs/cleanup', {
        method: 'DELETE'
      });
      
      if (response.success) {
        toast.success(`成功清理 ${response.data.deleted_count} 条过期日志`);
        fetchLogs();
      } else {
        toast.error(response.message || '清理失败');
      }
    } catch (error) {
      console.error('清理日志失败:', error);
      toast.error('清理失败');
    }
  };



  // 重置筛选
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('');
    setSelectedModule('');
    setDateRange({ start: '', end: '' });
    setCurrentPage(1);
  };

  // 获取日志类型样式
  const getLogTypeStyle = (type: string) => {
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
  };

  // 获取日志级别样式
  const getLevelStyle = (level: string) => {
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
  };

  // 格式化执行时间
  const formatExecutionTime = (time: number | undefined) => {
    if (!time) return '-';
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  };

  // 获取HTTP方法样式
  const getMethodStyle = (action: string) => {
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
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchLogs();
  }, [user, navigate, currentPage, searchQuery, selectedType, selectedModule, dateRange]);



  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div>
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">系统日志管理</h1>
          <p className="mt-2 text-gray-600">查看和管理系统运行日志</p>
        </div>





        {/* 筛选和操作栏 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="space-y-4">
            {/* 第一行：搜索、日志类型、模块 */}
            <div className="flex flex-col space-y-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
              {/* 搜索 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  搜索
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索操作或详情..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* 日志类型 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  日志类型
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">全部类型</option>
                  <option value="operation">操作</option>
                  <option value="error">错误</option>
                  <option value="security">安全</option>
                  <option value="system">系统</option>
                </select>
              </div>
              
              {/* 模块 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模块
                </label>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            
            {/* 第二行：日期范围、重置筛选按钮、清理过期日志按钮 */}
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-end lg:gap-4 lg:space-y-0">
              {/* 日期范围 */}
              <div className="lg:w-80">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  日期范围
                </label>
                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              {/* 按钮组 */}
              <div className="flex flex-col space-y-2 lg:flex-row lg:space-y-0 lg:space-x-2 lg:flex-shrink-0">
                {/* 重置筛选按钮 */}
                <button
                  onClick={handleResetFilters}
                  className="w-full lg:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition-colors flex items-center justify-center"
                >
                  <i className="fas fa-undo mr-2"></i>
                  重置筛选
                </button>
                
                {/* 清理过期日志按钮 */}
                <button
                  onClick={handleCleanupLogs}
                  className="w-full lg:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors flex items-center justify-center"
                >
                  <i className="fas fa-broom mr-2"></i>
                  清理过期日志
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 日志列表 */}
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
              {/* 表头 */}
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  日志列表 ({logs.length} 条)
                </h3>
              </div>
              
              {/* 日志项 */}
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
                            <span className="text-sm font-medium text-gray-900 hidden sm:inline">
                              {log.module}
                            </span>
                            <span className="text-sm text-gray-500 hidden md:inline">
                              {formatTime(log.created_at)}
                            </span>
                            {log.execution_time && (
                              <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded hidden lg:inline">
                                {formatExecutionTime(log.execution_time)}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <button
                              onClick={() => setSelectedLogForDetail(log)}
                              className="text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 text-sm whitespace-nowrap"
                              title="查看详情"
                            >
                              <i className="fas fa-eye"></i>
                            </button>

                          </div>
                        </div>
                        
                        <div className="mb-2">
                          <p className="text-sm text-gray-900 font-medium break-words">{log.action}</p>
                          <p className="text-sm text-gray-600 mt-1 break-words">
                            {log.description}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                          {log.username && (
                            <span className="flex items-center">
                              <i className="fas fa-user mr-1"></i>
                              <span className="break-all">{log.username}</span>
                            </span>
                          )}
                          {log.ip_address && (
                            <span className="flex items-center">
                              <i className="fas fa-globe mr-1"></i>
                              <span className="break-all">{log.ip_address}</span>
                            </span>
                          )}
                          {log.user_agent && (
                            <span className="flex items-center max-w-full" title={log.user_agent}>
                              <i className="fas fa-desktop mr-1 flex-shrink-0"></i>
                              <span className="truncate">{log.user_agent}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 分页 */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      第 {currentPage} 页，共 {totalPages} 页
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        上一页
                      </button>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        下一页
                      </button>
                    </div>
                  </div>
                </div>
              )}
              </>
            )}
          </div>
        </div>
      
      {/* 日志详情弹窗 */}
      {selectedLogForDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">日志详情</h3>
              <button
                onClick={() => setSelectedLogForDetail(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            {/* 弹窗内容 */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
              <div className="space-y-6">
                {/* 基本信息 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">基本信息</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <span className="text-sm font-medium text-gray-600 mb-1 sm:mb-0">日志类型:</span>
                        <span className={`ml-0 sm:ml-2 px-2 py-1 text-xs font-medium rounded-full border w-fit ${getLogTypeStyle(selectedLogForDetail.log_type)}`}>
                          {selectedLogForDetail.log_type.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <span className="text-sm font-medium text-gray-600 mb-1 sm:mb-0">时间:</span>
                        <span className="ml-0 sm:ml-2 text-sm text-gray-900 break-words">{formatTime(selectedLogForDetail.created_at)}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <span className="text-sm font-medium text-gray-600 mb-1 sm:mb-0">用户:</span>
                        <span className="ml-0 sm:ml-2 text-sm text-gray-900 break-words">{selectedLogForDetail.username || '未知用户'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <span className="text-sm font-medium text-gray-600 mb-1 sm:mb-0">IP地址:</span>
                        <span className="ml-0 sm:ml-2 text-sm text-gray-900 break-all">{selectedLogForDetail.ip_address || '未知'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <span className="text-sm font-medium text-gray-600 mb-1 sm:mb-0">模块:</span>
                        <span className="ml-0 sm:ml-2 text-sm text-gray-900 break-words">{selectedLogForDetail.module}</span>
                      </div>
                      {selectedLogForDetail.execution_time && (
                        <div className="flex flex-col sm:flex-row sm:items-center">
                          <span className="text-sm font-medium text-gray-600 mb-1 sm:mb-0">执行时间:</span>
                          <span className="ml-0 sm:ml-2 text-sm text-gray-900">{formatExecutionTime(selectedLogForDetail.execution_time)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 操作详情 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">操作详情</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">操作:</span>
                      <p className="text-sm text-gray-900 mt-1 break-words">{selectedLogForDetail.action}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">描述:</span>
                      <p className="text-sm text-gray-900 mt-1 break-words">{selectedLogForDetail.description}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* User Agent */}
              {selectedLogForDetail.user_agent && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">用户代理</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded border break-all">
                    {selectedLogForDetail.user_agent}
                  </p>
                </div>
              )}
              
              {/* 请求数据 */}
              {selectedLogForDetail.request_data && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">请求数据</label>
                  <pre className="text-xs text-gray-700 bg-gray-50 p-4 rounded border overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedLogForDetail.request_data, null, 2)}
                  </pre>
                </div>
              )}
              
              {/* 响应数据 */}
              {selectedLogForDetail.response_data && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">响应数据</label>
                  <pre className="text-xs text-gray-700 bg-gray-50 p-4 rounded border overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedLogForDetail.response_data, null, 2)}
                  </pre>
                </div>
              )}
              
              {/* 错误信息 */}
              {selectedLogForDetail.error_message && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">错误信息</label>
                  <pre className="text-xs text-red-700 bg-red-50 p-4 rounded border overflow-x-auto whitespace-pre-wrap">
                    {selectedLogForDetail.error_message}
                  </pre>
                </div>
              )}
            </div>
            
            {/* 弹窗底部 */}
            <div className="flex justify-end p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => setSelectedLogForDetail(null)}
                className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
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