import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, lazy, Suspense, useCallback, useMemo } from "react";
import { AuthContext, User } from '@/contexts/authContext';
import LoadingSpinner from "@/components/LoadingSpinner";

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
const WorkEditor = lazy(() => import("@/pages/WorkEditor"));
const Moments = lazy(() => import("@/pages/Moments"));
const MomentDetail = lazy(() => import("@/pages/MomentDetail"));
const Photos = lazy(() => import("@/pages/Photos"));
const ThoughtsPage = lazy(() => import("@/pages/ThoughtsPage"));
const TaskDetailPage = lazy(() => import("@/pages/TaskDetailPage"));
const AIAssistant = lazy(() => import('@/components/chat/AIAssistant').then((mod) => ({
  default: mod.AIAssistant
})));
const AdminToaster = lazy(() => import('@/components/admin/AdminToaster'));

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

// 记住我: 7天；会话登录: 12小时
const getExpirationDate = (remember: boolean) => {
  const date = new Date();
  if (remember) {
    date.setDate(date.getDate() + 7);
  } else {
    date.setHours(date.getHours() + 12);
  }
  return date.toISOString();
};

// 验证token是否过期
const isTokenValid = (expirationDate: string) => {
  return new Date(expirationDate) > new Date();
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAssistantMounted, setIsAssistantMounted] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const shouldShowAIAssistant = useMemo(() => {
    const path = location.pathname;
    return !(
      path.startsWith('/dashboard') ||
      path.startsWith('/admin/') ||
      path === '/profile'
    );
  }, [location.pathname]);

  const shouldShowAdminToaster = useMemo(() => {
    const path = location.pathname;
    return (
      path.startsWith('/dashboard') ||
      path.startsWith('/admin/') ||
      path === '/profile'
    );
  }, [location.pathname]);

  // 初始化时检查本地存储的认证状态
  useEffect(() => {
    const savedAuth = localStorage.getItem('auth') || sessionStorage.getItem('auth');
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
        sessionStorage.removeItem('auth');
      }
    }
  }, []);

  // 前台场景下延迟挂载 AI 助手，避免影响首屏加载
  useEffect(() => {
    if (!shouldShowAIAssistant) {
      setIsAssistantMounted(false);
      return;
    }

    let timeoutId: number | null = null;
    let idleId: number | null = null;
    const mountAssistant = () => setIsAssistantMounted(true);
    const idleWindow = window as Window & {
      requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (idleWindow.requestIdleCallback) {
      idleId = idleWindow.requestIdleCallback(mountAssistant, { timeout: 1500 });
    } else {
      timeoutId = window.setTimeout(mountAssistant, 1500);
    }

    return () => {
      if (idleId !== null && idleWindow.cancelIdleCallback) {
        idleWindow.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [shouldShowAIAssistant]);

  const login = useCallback((userData: User, token: string, remember: boolean = false) => {
    setIsAuthenticated(true);

    // 直接使用传入的用户数据
    const user = userData || DEFAULT_USER;
    setUser(user);

    const authData = {
      token,
      expiration: getExpirationDate(remember),
      user
    };

    if (remember) {
      localStorage.setItem('auth', JSON.stringify(authData));
      sessionStorage.removeItem('auth');
    } else {
      sessionStorage.setItem('auth', JSON.stringify(authData));
      localStorage.removeItem('auth');
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('auth');
    sessionStorage.removeItem('auth');
    navigate('/login');
  }, [navigate]);

  const updateUser = useCallback((userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);

      // 更新localStorage中的用户数据
      const savedAuth = localStorage.getItem('auth') || sessionStorage.getItem('auth');
      if (savedAuth) {
        const authData = parseJSON<{ user?: User }>(
          savedAuth,
          'Failed to update user data'
        );

        if (authData) {
          authData.user = updatedUser;
          if (localStorage.getItem('auth')) {
            localStorage.setItem('auth', JSON.stringify(authData));
          }
          if (sessionStorage.getItem('auth')) {
            sessionStorage.setItem('auth', JSON.stringify(authData));
          }
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
      {shouldShowAdminToaster && (
        <Suspense fallback={null}>
          <AdminToaster />
        </Suspense>
      )}
      {shouldShowAIAssistant && isAssistantMounted && (
        <Suspense fallback={null}>
          <AIAssistant />
        </Suspense>
      )}
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" text="加载页面资源中..." /></div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/works" element={<Works />} />
          <Route path="/works/:id" element={<WorkDetail />} />
          <Route path="/blogs" element={<Blog />} />
          <Route path="/blogs/:id" element={<BlogDetail />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Login />} />
          <Route path="/dashboard/tasks/:id" element={isAuthenticated ? <TaskDetailPage /> : <Login />} />
          <Route path="/profile" element={isAuthenticated ? <Profile /> : <Login />} />
          <Route path="/admin/blogs" element={isAuthenticated ? <BlogManagement /> : <Login />} />
          <Route path="/admin/blog/create" element={isAuthenticated ? <BlogEditor /> : <Login />} />
          <Route path="/admin/blog/edit/:id" element={isAuthenticated ? <BlogEditor /> : <Login />} />
          <Route path="/admin/work/create" element={isAuthenticated ? <WorkEditor /> : <Login />} />
          <Route path="/admin/work/edit/:id" element={isAuthenticated ? <WorkEditor /> : <Login />} />
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
