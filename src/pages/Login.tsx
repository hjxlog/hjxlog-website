import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { apiRequest } from '../config/api';
import { motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    } catch (error) {
      console.error('登录失败:', error);
      toast.error('网络连接失败，请检查服务器是否正常运行');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center w-full bg-[#F8FAFC] relative overflow-hidden">
      {/* 极简背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -right-[10%] w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-[100px] opacity-60"></div>
        <div className="absolute -bottom-[30%] -left-[10%] w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-[100px] opacity-60"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[420px] mx-4 relative z-10"
      >
        <div className="bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-white/50 ring-1 ring-slate-100">
          {/* 品牌头部 */}
          <div className="flex flex-col items-center mb-10">
            <motion.div 
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-5 text-white"
            >
              <span className="text-2xl font-bold">H</span>
            </motion.div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">欢迎回来</h1>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              登录 HJXLOG 管理您的数字空间
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-5">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1.5">
                  用户名
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#165DFF] transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF] transition-all bg-white/80 hover:bg-white"
                    placeholder="请输入用户名"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  密码
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#165DFF] transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF] transition-all bg-white/80 hover:bg-white"
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#165DFF] focus:ring-[#165DFF] border-slate-300 rounded cursor-pointer"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 cursor-pointer select-none">
                  记住我 (7天)
                </label>
              </div>
              
              <div className="text-sm">
                <a href="#" className="font-medium text-[#165DFF] hover:text-[#165DFF]/80 transition-colors">
                  忘记密码?
                </a>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-[#165DFF] hover:bg-[#165DFF]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#165DFF] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  正在登录...
                </div>
              ) : (
                <div className="flex items-center">
                  登录账户
                  <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </motion.button>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                还没有账户?{' '}
                <a href="#" className="font-medium text-[#165DFF] hover:text-[#165DFF]/80 transition-colors">
                  联系管理员
                </a>
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
