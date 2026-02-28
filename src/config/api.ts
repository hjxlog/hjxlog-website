// API配置文件
// 统一管理API地址，避免硬编码

// 无论开发还是生产环境，都统一使用相对路径，由代理服务器（Vite Proxy 或 Nginx）处理转发
// 这样可以避免在代码中硬编码 localhost，防止触发浏览器的本地网络权限警告
export const API_BASE_URL = '';

// 通用API请求函数
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  // 尝试从localStorage获取认证token
  let authHeaders = {};
  try {
    const authData = localStorage.getItem('auth') || sessionStorage.getItem('auth');
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
