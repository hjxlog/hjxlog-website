import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { apiRequest } from '../config/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // 页面加载时检查是否有保存的登录信息
  useEffect(() => {
    const savedUsername = localStorage.getItem('savedUsername');
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
    
    if (savedUsername && savedRememberMe) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 简单验证
    if (!username || !password) {
      toast.error('请输入用户名和密码');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 使用真实API登录
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      
      if (data.success) {
        // 保存用户信息
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // 处理记住我功能
        if (rememberMe) {
          localStorage.setItem('savedUsername', username);
          localStorage.setItem('rememberMe', 'true');
          // 设置7天后过期的时间戳
          const expiryTime = new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
          localStorage.setItem('loginExpiry', expiryTime.toString());
        } else {
          localStorage.removeItem('savedUsername');
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('loginExpiry');
        }
        
        // 调用AuthContext中的login方法
        login(rememberMe);
        toast.success('登录成功！');
        // 确保在状态更新后再导航
        setTimeout(() => {
          navigate('/dashboard');
        }, 100);
      } else {
        toast.error(data.message || '登录失败');
      }
    } catch (error: any) {
      console.error('登录失败:', error);
      toast.error('网络连接失败，请检查服务器是否正常运行');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md glass-card p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800">登录账户</h2>
          <p className="mt-2 text-slate-600">欢迎回来，请登录您的账户</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="form-label">用户名</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="form-label">密码</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[#165DFF] focus:ring-[#165DFF] border-slate-300 rounded"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
                记住我 (7天内保持登录)
              </label>
            </div>
            
            <div className="text-sm">
              <a href="#" className="font-medium text-[#165DFF] hover:text-[#165DFF]/80">
                忘记密码?
              </a>
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-[#165DFF] text-white hover:bg-[#165DFF]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                登录中...
              </div>
            ) : (
              '登录'
            )}
          </button>
        </form>
        

      </div>
    </div>
  );
}