// API配置文件
// 统一管理API地址，避免硬编码

// 开发环境API地址
const DEV_API_BASE_URL = 'http://localhost:3006';

// 生产环境API地址（使用相对路径，通过nginx代理）
const PROD_API_BASE_URL = '';

// 根据环境变量或当前环境自动选择API地址
export const API_BASE_URL = import.meta.env.PROD 
  ? PROD_API_BASE_URL 
  : DEV_API_BASE_URL;

// 通用API请求函数
export const apiRequest = async (endpoint: string, options?: RequestInit) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};