import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import AdminNav from '@/components/AdminNav';
import { toast } from 'sonner';
import { API_BASE_URL, apiRequest } from '@/config/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

interface SystemLog {
  id: number;
  log_type: 'info' | 'warning' | 'error' | 'debug';
  module_name: string;
  operation: string;
  details?: any;
  user_id?: number;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  username?: string;
}

export default function LogDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [log, setLog] = useState<SystemLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取日志详情
  const fetchLogDetail = async () => {
    if (!id) {
      setError('日志ID无效');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiRequest(`/api/admin/logs/${id}`);
      if (response.success) {
        setLog(response.data);
      } else {
        setError(response.message || '获取日志详情失败');
      }
    } catch (error) {
      console.error('获取日志详情失败:', error);
      setError('获取日志详情失败');
    } finally {
      setLoading(false);
    }
  };



  // 获取日志类型样式
  const getLogTypeStyle = (type: string) => {
    switch (type) {
      case 'error':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-200',
          icon: 'fas fa-exclamation-triangle',
          iconColor: 'text-red-600'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-200',
          icon: 'fas fa-exclamation-circle',
          iconColor: 'text-yellow-600'
        };
      case 'info':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          border: 'border-blue-200',
          icon: 'fas fa-info-circle',
          iconColor: 'text-blue-600'
        };
      case 'debug':
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200',
          icon: 'fas fa-bug',
          iconColor: 'text-gray-600'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200',
          icon: 'fas fa-file-alt',
          iconColor: 'text-gray-600'
        };
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
      second: '2-digit',
      weekday: 'long'
    });
  };

  // 格式化详情数据
  const formatDetails = (details: any) => {
    if (!details) return null;
    
    if (typeof details === 'string') {
      try {
        const parsed = JSON.parse(details);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return details;
      }
    }
    
    return JSON.stringify(details, null, 2);
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchLogDetail();
  }, [user, navigate, id]);

  if (!user) {
    return <LoadingSpinner />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !log) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorMessage message={error || '日志不存在'} />
          <div className="mt-6">
            <button
              onClick={() => navigate('/log-management')}
              className="px-4 py-2 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              返回日志列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  const typeStyle = getLogTypeStyle(log.log_type);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题和操作 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/log-management')}
                className="text-blue-600 hover:text-blue-800 transition-colors mb-2"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                返回日志列表
              </button>
              <h1 className="text-3xl font-bold text-gray-900">日志详情</h1>
              <p className="mt-2 text-gray-600">查看系统日志的详细信息</p>
            </div>
            

          </div>
        </div>

        {/* 日志详情卡片 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* 日志头部信息 */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-lg ${typeStyle.bg}`}>
                <i className={`${typeStyle.icon} ${typeStyle.iconColor} text-xl`}></i>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}>
                    {log.log_type.toUpperCase()}
                  </span>
                  <span className="text-lg font-semibold text-gray-900">
                    {log.module_name}
                  </span>
                  <span className="text-sm text-gray-500">
                    ID: {log.id}
                  </span>
                </div>
                
                <p className="text-gray-600">
                  {formatTime(log.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* 日志内容 */}
          <div className="px-6 py-6">
            <div className="space-y-6">
              {/* 操作信息 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">操作信息</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900 font-medium">{log.operation}</p>
                </div>
              </div>

              {/* 详细信息 */}
              {log.details && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">详细信息</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
                      {formatDetails(log.details)}
                    </pre>
                  </div>
                </div>
              )}

              {/* 用户和环境信息 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">环境信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 用户信息 */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">
                      <i className="fas fa-user mr-2"></i>
                      用户信息
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">用户ID:</span> {log.user_id || '未知'}
                      </p>
                      <p>
                        <span className="font-medium">用户名:</span> {log.username || '未知'}
                      </p>
                    </div>
                  </div>

                  {/* 网络信息 */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">
                      <i className="fas fa-globe mr-2"></i>
                      网络信息
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">IP地址:</span> {log.ip_address || '未知'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* User Agent */}
                {log.user_agent && (
                  <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">
                      <i className="fas fa-desktop mr-2"></i>
                      用户代理
                    </h4>
                    <p className="text-sm text-gray-600 break-all">
                      {log.user_agent}
                    </p>
                  </div>
                )}
              </div>

              {/* 时间信息 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">时间信息</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">创建时间:</span>
                      <p className="mt-1">{formatTime(log.created_at)}</p>
                    </div>
                    <div>
                      <span className="font-medium">相对时间:</span>
                      <p className="mt-1">
                        {new Date(log.created_at).toLocaleString('zh-CN', {
                          timeZone: 'Asia/Shanghai',
                          timeZoneName: 'short'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => navigate('/log-management')}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            返回列表
          </button>
          
          <div className="space-x-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
            >
              <i className="fas fa-print mr-2"></i>
              打印
            </button>
            

          </div>
        </div>
      </div>
    </div>
  );
}