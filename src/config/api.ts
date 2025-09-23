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
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  // 尝试从localStorage获取认证token
  let authHeaders = {};
  try {
    const authData = localStorage.getItem('auth');
    if (authData) {
      const { token, expiration } = JSON.parse(authData);
      // 检查token是否存在且未过期
      if (token && expiration && new Date(expiration) > new Date()) {
        authHeaders = {
          'Authorization': `Bearer ${token}`
        };
      }
    }
  } catch (error) {
    console.error('Failed to parse auth data:', error);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};