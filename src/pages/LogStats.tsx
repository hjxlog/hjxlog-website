import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import AdminNav from '@/components/AdminNav';
import { toast } from 'sonner';
import { API_BASE_URL, apiRequest } from '@/config/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

interface LogStats {
  total: number;
  today: number;
  error_count: number;
  warning_count: number;
  info_count: number;
  debug_count: number;
  daily_stats: Array<{
    date: string;
    total: number;
    error_count: number;
    warning_count: number;
    info_count: number;
    debug_count: number;
  }>;
  module_stats: Array<{
    module_name: string;
    total: number;
    error_count: number;
    warning_count: number;
    info_count: number;
    debug_count: number;
  }>;
  hourly_stats: Array<{
    hour: number;
    total: number;
    error_count: number;
    warning_count: number;
    info_count: number;
    debug_count: number;
  }>;
}

export default function LogStats() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7天前
    end: new Date().toISOString().split('T')[0] // 今天
  });

  // 获取统计数据
  const fetchStats = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        start_date: dateRange.start,
        end_date: dateRange.end
      });

      const response = await apiRequest(`/api/admin/logs/stats?${params}`);
      if (response.success) {
        setStats(response.data);
      } else {
        setError(response.message || '获取统计数据失败');
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
      setError('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取日志类型颜色
  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
      case 'debug':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  // 获取百分比
  const getPercentage = (count: number, total: number) => {
    return total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit'
    });
  };

  // 格式化小时
  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchStats();
  }, [user, navigate, dateRange]);

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">日志统计分析</h1>
          <p className="mt-2 text-gray-600">查看系统日志的统计信息和趋势分析</p>
        </div>

        {/* 日期范围选择 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">开始日期</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">结束日期</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center">
              <button
                onClick={fetchStats}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors mt-7"
              >
                <i className="fas fa-search mr-2"></i>
                查询
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <ErrorMessage message={error} />
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* 总体统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <i className="fas fa-list text-blue-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">总日志数</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <i className="fas fa-calendar-day text-green-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">今日日志</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <i className="fas fa-exclamation-triangle text-red-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">错误</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.error_count}</p>
                    <p className="text-xs text-gray-500">{getPercentage(stats.error_count, stats.total)}%</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <i className="fas fa-exclamation-circle text-yellow-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">警告</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.warning_count}</p>
                    <p className="text-xs text-gray-500">{getPercentage(stats.warning_count, stats.total)}%</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <i className="fas fa-info-circle text-blue-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">信息</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.info_count}</p>
                    <p className="text-xs text-gray-500">{getPercentage(stats.info_count, stats.total)}%</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <i className="fas fa-bug text-gray-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">调试</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.debug_count}</p>
                    <p className="text-xs text-gray-500">{getPercentage(stats.debug_count, stats.total)}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 日志类型分布饼图 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">日志类型分布</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 简单的条形图表示 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-500 rounded mr-3"></div>
                      <span className="text-sm font-medium text-gray-700">错误</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{stats.error_count}</span>
                      <span className="text-xs text-gray-500">({getPercentage(stats.error_count, stats.total)}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${getPercentage(stats.error_count, stats.total)}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-yellow-500 rounded mr-3"></div>
                      <span className="text-sm font-medium text-gray-700">警告</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{stats.warning_count}</span>
                      <span className="text-xs text-gray-500">({getPercentage(stats.warning_count, stats.total)}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${getPercentage(stats.warning_count, stats.total)}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                      <span className="text-sm font-medium text-gray-700">信息</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{stats.info_count}</span>
                      <span className="text-xs text-gray-500">({getPercentage(stats.info_count, stats.total)}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${getPercentage(stats.info_count, stats.total)}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-500 rounded mr-3"></div>
                      <span className="text-sm font-medium text-gray-700">调试</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{stats.debug_count}</span>
                      <span className="text-xs text-gray-500">({getPercentage(stats.debug_count, stats.total)}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gray-500 h-2 rounded-full" 
                      style={{ width: `${getPercentage(stats.debug_count, stats.total)}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* 数值统计 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">统计摘要</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">总日志数:</span>
                      <span className="font-medium text-gray-900">{stats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">错误率:</span>
                      <span className="font-medium text-red-600">{getPercentage(stats.error_count, stats.total)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">警告率:</span>
                      <span className="font-medium text-yellow-600">{getPercentage(stats.warning_count, stats.total)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">正常率:</span>
                      <span className="font-medium text-green-600">
                        {getPercentage(stats.info_count + stats.debug_count, stats.total)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 每日趋势 */}
            {stats.daily_stats && stats.daily_stats.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">每日日志趋势</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总计</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">错误</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">警告</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">信息</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">调试</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.daily_stats.map((day, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatDate(day.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.total}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{day.error_count}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">{day.warning_count}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{day.info_count}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{day.debug_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 模块统计 */}
            {stats.module_stats && stats.module_stats.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">模块日志统计</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">模块</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总计</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">错误</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">警告</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">信息</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">调试</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">错误率</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.module_stats.map((module, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {module.module_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{module.total}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{module.error_count}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">{module.warning_count}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{module.info_count}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{module.debug_count}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`font-medium ${
                              parseFloat(getPercentage(module.error_count, module.total)) > 10 
                                ? 'text-red-600' 
                                : parseFloat(getPercentage(module.error_count, module.total)) > 5 
                                ? 'text-yellow-600' 
                                : 'text-green-600'
                            }`}>
                              {getPercentage(module.error_count, module.total)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 小时分布 */}
            {stats.hourly_stats && stats.hourly_stats.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">24小时分布</h3>
                <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                  {stats.hourly_stats.map((hour, index) => (
                    <div key={index} className="text-center">
                      <div className="text-xs text-gray-500 mb-1">{formatHour(hour.hour)}</div>
                      <div 
                        className="bg-blue-500 rounded" 
                        style={{ 
                          height: `${Math.max(4, (hour.total / Math.max(...stats.hourly_stats.map(h => h.total))) * 60)}px` 
                        }}
                        title={`${formatHour(hour.hour)}: ${hour.total} 条日志`}
                      ></div>
                      <div className="text-xs text-gray-600 mt-1">{hour.total}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}