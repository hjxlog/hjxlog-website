import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

interface ConnectionStatus {
  isConnected: boolean;
  message: string;
  lastChecked: string;
  details?: {
    host?: string;
    port?: number;
    database?: string;
    connectionTime?: number;
  };
}

const defaultConfig: DatabaseConfig = {
  host: 'localhost',
  port: 3306,
  database: 'hjxlog_blog',
  username: 'root',
  password: ''
};

export default function DatabaseConfig() {
  const [config, setConfig] = useState<DatabaseConfig>(defaultConfig);
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    message: '未连接',
    lastChecked: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadConfig();
    updateConnectionStatus();
  }, []);

  const loadConfig = () => {
    try {
      const savedConfig = localStorage.getItem('databaseConfig');
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
    } catch (error) {
      console.error('Failed to load config from localStorage:', error);
    }
  };

  const updateConnectionStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      const data = await response.json();
      
      if (response.ok && data.status === 'ok') {
        setStatus({
          isConnected: true,
          message: '连接正常',
          lastChecked: new Date().toLocaleString(),
          details: {
            host: config.host,
            port: config.port,
            database: config.database,
            connectionTime: Date.now()
          }
        });
      } else {
        setStatus({
          isConnected: false,
          message: data.message || '连接失败',
          lastChecked: new Date().toLocaleString()
        });
      }
    } catch (error) {
      setStatus({
        isConnected: false,
        message: '无法连接到服务器',
        lastChecked: new Date().toLocaleString()
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: name === 'port' ? parseInt(value) || 0 : value
    }));
  };

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3006/api/health');
      const data = await response.json();
      
      if (response.ok && data.status === 'ok') {
        setStatus({
          isConnected: true,
          message: '连接测试成功',
          lastChecked: new Date().toLocaleString(),
          details: {
            host: config.host,
            port: config.port,
            database: config.database,
            connectionTime: Date.now()
          }
        });
      } else {
        setStatus({
          isConnected: false,
          message: data.message || '连接测试失败',
          lastChecked: new Date().toLocaleString()
        });
      }
    } catch (error) {
      setStatus({
        isConnected: false,
        message: '连接测试失败: 无法连接到服务器',
        lastChecked: new Date().toLocaleString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = () => {
    try {
      localStorage.setItem('databaseConfig', JSON.stringify(config));
      alert('配置已保存');
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('保存配置失败');
    }
  };

  const resetConfig = () => {
    setConfig(defaultConfig);
    localStorage.removeItem('databaseConfig');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">数据库配置</h2>
      
      {/* 连接状态 */}
      <div className={`p-4 rounded-lg mb-6 ${
        status.isConnected ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-semibold ${
              status.isConnected ? 'text-green-800' : 'text-red-800'
            }`}>
              连接状态: {status.message}
            </h3>
            {status.lastChecked && (
              <p className="text-sm text-gray-600 mt-1">
                最后检查: {status.lastChecked}
              </p>
            )}
          </div>
          <div className={`w-3 h-3 rounded-full ${
            status.isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
        </div>
        
        {status.details && (
          <div className="mt-3 text-sm text-gray-600">
            <p>主机: {status.details.host}:{status.details.port}</p>
            <p>数据库: {status.details.database}</p>
          </div>
        )}
      </div>

      {/* 配置表单 */}
      <div className="space-y-4">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            密码
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={config.password}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              placeholder="密码"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
            >
              {showPassword ? '隐藏' : '显示'}
            </button>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex space-x-3 mt-6">
        <button
          onClick={testConnection}
          disabled={isLoading}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '测试中...' : '测试连接'}
        </button>
        
        <button
          onClick={saveConfig}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
        >
          保存配置
        </button>
        
        <button
          onClick={resetConfig}
          className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
        >
          重置配置
        </button>
      </div>
    </div>
  );
}