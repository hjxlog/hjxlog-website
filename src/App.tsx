import { Routes, Route, useNavigate } from "react-router-dom";
import { useState, useEffect, lazy, Suspense, useCallback, useMemo } from "react";
import { AuthContext, User } from '@/contexts/authContext';
import { Toaster } from 'sonner';
import LoadingSpinner from "@/components/LoadingSpinner";
import { AIAssistant } from "@/components/chat/AIAssistant";

// 懒加载页面组件
const Home = lazy(() => import("@/pages/Home"));
const Login = lazy(() => import("@/pages/Login"));
const Works = lazy(() => import("@/pages/Works"));
const WorkDetail = lazy(() => import("@/pages/WorkDetail"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogDetail = lazy(() => import("@/pages/BlogDetail"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Profile = lazy(() => import("@/pages/Profile"));
const BlogManagement = lazy(() => import("@/pages/BlogManagement"));
const BlogEditor = lazy(() => import("@/pages/BlogEditor"));
const Moments = lazy(() => import("@/pages/Moments"));
const MomentDetail = lazy(() => import("@/pages/MomentDetail"));
const Photos = lazy(() => import("@/pages/Photos"));
const ThoughtsPage = lazy(() => import("@/pages/ThoughtsPage"));

const DEFAULT_USER: User = {
  id: '1',
  username: 'Admin',
  email: 'admin@example.com'
};

const parseJSON = <T,>(raw: string, errorMessage: string): T | null => {
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(errorMessage, error);
    return null;
  }
};

// 计算7天后的过期时间
const getExpirationDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString();
};

// 验证token是否过期
const isTokenValid = (expirationDate: string) => {
  return new Date(expirationDate) > new Date();
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // 初始化时检查本地存储的认证状态
  useEffect(() => {
    const savedAuth = localStorage.getItem('auth');
    if (savedAuth) {
      const authData = parseJSON<{ token?: string; expiration?: string; user?: User }>(
        savedAuth,
        'Failed to parse auth data'
      );

      if (authData?.token && authData.expiration && isTokenValid(authData.expiration)) {
        setIsAuthenticated(true);
        setUser(authData.user || DEFAULT_USER);
      } else {
        // Token过期或格式错误，清除存储
        localStorage.removeItem('auth');
      }
    }
  }, []);

  const login = useCallback((userData: User, remember: boolean = false) => {
    setIsAuthenticated(true);

    // 直接使用传入的用户数据
    const user = userData || DEFAULT_USER;
    setUser(user);

    // 如果勾选"记住我"，保存到localStorage
    if (remember) {
      const authData = {
        token: 'token-' + Date.now(),
        expiration: getExpirationDate(),
        user: user
      };
      localStorage.setItem('auth', JSON.stringify(authData));
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('auth');
    navigate('/login');
  }, [navigate]);

  const updateUser = useCallback((userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);

      // 更新localStorage中的用户数据
      const savedAuth = localStorage.getItem('auth');
      if (savedAuth) {
        const authData = parseJSON<{ user?: User }>(
          savedAuth,
          'Failed to update user data'
        );

        if (authData) {
          authData.user = updatedUser;
          localStorage.setItem('auth', JSON.stringify(authData));
        }
      }
    }
  }, [user]);

  const authContextValue = useMemo(
    () => ({ isAuthenticated, login, logout, user, updateUser }),
    [isAuthenticated, login, logout, user, updateUser]
  );

  return (
    <AuthContext.Provider
      value={authContextValue}
    >
      <Toaster position="top-right" richColors />
      <AIAssistant />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" text="加载页面资源中..." /></div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/works" element={<Works />} />
          <Route path="/works/:id" element={<WorkDetail />} />
          <Route path="/blogs" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogDetail />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Login />} />
          <Route path="/profile" element={isAuthenticated ? <Profile /> : <Login />} />
          <Route path="/admin/blogs" element={isAuthenticated ? <BlogManagement /> : <Login />} />
          <Route path="/admin/blog/create" element={isAuthenticated ? <BlogEditor /> : <Login />} />
          <Route path="/admin/blog/edit/:id" element={isAuthenticated ? <BlogEditor /> : <Login />} />
          <Route path="/moments" element={<Moments />} />
          <Route path="/moments/:id" element={<MomentDetail />} />
          <Route path="/photos" element={<Photos />} />
          <Route path="/admin/thoughts" element={isAuthenticated ? <ThoughtsPage /> : <Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AuthContext.Provider>
  );
}
