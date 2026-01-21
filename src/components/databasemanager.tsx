import React, { useState, useEffect } from 'react';
import { apiRequest, API_BASE_URL } from '../config/api';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

const defaultConfig: DatabaseConfig = {
  host: '',
  port: 3306,
  database: 'hjxlog_blog',
  username: 'root',
  password: ''
};

export default function DatabaseManager() {
  const [isConnected, setIsConnected] = useState(false);
  const [config, setConfig] = useState<DatabaseConfig>(defaultConfig);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const data = await apiRequest('/api/health');
      
      if (data.status === 'ok') {
        setIsConnected(true);
        setConnectionStatus('数据库连接正常');
      } else {
        setIsConnected(false);
        setConnectionStatus(data.message || '数据库连接失败');
      }
    } catch (error) {
      setIsConnected(false);
      setConnectionStatus('无法连接到服务器');
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest('/api/health');
      
      if (data.status === 'ok') {
        setIsConnected(true);
        setConnectionStatus('连接成功');
      } else {
        setIsConnected(false);
        setConnectionStatus(data.message || '连接失败');
      }
    } catch (error) {
      setIsConnected(false);
      setConnectionStatus('连接失败: 无法连接到服务器');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setConnectionStatus('已断开连接');
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      const data = await response.json();
      
      if (response.ok && data.status === 'ok') {
        setConnectionStatus('连接测试成功');
      } else {
        setConnectionStatus(data.message || '连接测试失败');
      }
    } catch (error) {
      setConnectionStatus('连接测试失败: 无法连接到服务器');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: name === 'port' ? parseInt(value) || 0 : value
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">数据库管理</h2>
      
      {/* 连接状态显示 */}
      <div className={`p-4 rounded-lg mb-6 ${
        isConnected ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-semibold ${
              isConnected ? 'text-green-800' : 'text-red-800'
            }`}>
              {isConnected ? <><i className="fas fa-check-circle mr-2"></i> 已连接</> : <><i className="fas fa-times-circle mr-2"></i> 未连接</>}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{connectionStatus}</p>
          </div>
          <div className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
        </div>
      </div>

      {/* 数据库配置 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            主机地址
          </label>
          <input
            type="text"
            name="host"
            value={config.host}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="localhost"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            端口
          </label>
          <input
            type="number"
            name="port"
            value={config.port}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="3306"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            数据库名
          </label>
          <input
            type="text"
            name="database"
            value={config.database}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="hjxlog_blog"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            用户名
          </label>
          <input
            type="text"
            name="username"
            value={config.username}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="root"
          />
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleConnect}
          disabled={isLoading || isConnected}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '连接中...' : '连接数据库'}
        </button>

        <button
          onClick={handleDisconnect}
          disabled={!isConnected}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          断开连接
        </button>

        <button
          onClick={handleTestConnection}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '测试中...' : '测试连接'}
        </button>

        <button
          onClick={checkConnection}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          刷新状态
        </button>
      </div>

      {/* 数据库信息 */}
      {isConnected && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">连接信息</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">主机:</span> {config.host}
            </div>
            <div>
              <span className="font-medium">端口:</span> {config.port}
            </div>
            <div>
              <span className="font-medium">数据库:</span> {config.database}
            </div>
            <div>
              <span className="font-medium">用户:</span> {config.username}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}