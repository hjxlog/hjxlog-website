import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import Home from "@/pages/Home";
import { useState, useEffect } from "react";
import { AuthContext, User } from '@/contexts/authContext';
import { Toaster } from 'sonner';
import Login from "@/pages/Login";
import Works from "@/pages/Works";
import WorkDetail from "@/pages/WorkDetail";
import Blog from "@/pages/Blog";
import BlogDetail from "@/pages/BlogDetail";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";
import Profile from "@/pages/Profile";

import BlogManagement from "@/pages/BlogManagement";
import BlogEditor from "@/pages/BlogEditor";
import Moments from "@/pages/Moments";
import MomentDetail from "@/pages/MomentDetail";
import Photos from "@/pages/Photos";
import KnowledgeBase from "@/pages/KnowledgeBase";
import { AIAssistant } from "@/components/chat/AIAssistant";

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
      try {
        const authData = JSON.parse(savedAuth);
        if (authData.token && authData.expiration && isTokenValid(authData.expiration)) {
          setIsAuthenticated(true);
          setUser(authData.user || {
            id: '1',
            username: 'Admin',
            email: 'admin@example.com'
          });
        } else {
          // Token过期，清除存储
          localStorage.removeItem('auth');
        }
      } catch (error) {
        console.error('Failed to parse auth data', error);
        localStorage.removeItem('auth');
      }
    }
    
    // 加载作品数据
    const savedWorks = localStorage.getItem('works');
    if (savedWorks) {
      try {
        const works = JSON.parse(savedWorks);
        // 可以在这里将数据保存到全局状态
      } catch (error) {
        console.error('Failed to parse works data', error);
      }
    }
    
    // 加载博客数据
    const savedBlogs = localStorage.getItem('blogs');
    if (savedBlogs) {
      try {
        const blogs = JSON.parse(savedBlogs);
        // 可以在这里将数据保存到全局状态
      } catch (error) {
        console.error('Failed to parse blogs data', error);
      }
    }
  }, []);
  
  const login = (remember: boolean = false) => {
    setIsAuthenticated(true);
    
    // 从localStorage获取用户数据
    const savedUser = localStorage.getItem('user');
    let userData = null;
    
    if (savedUser) {
      try {
        userData = JSON.parse(savedUser);
      } catch (error) {
        console.error('Failed to parse user data', error);
      }
    }
    
    // 如果没有用户数据，使用默认数据
    if (!userData) {
      userData = {
        id: '1',
        username: 'Admin',
        email: 'admin@example.com'
      };
    }
    
    setUser(userData);
    
    // 如果勾选"记住我"，保存到localStorage
    if (remember) {
      const authData = {
        token: 'token-' + Date.now(),
        expiration: getExpirationDate(),
        user: userData
      };
      localStorage.setItem('auth', JSON.stringify(authData));
    }
  };
  
  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('auth');
    navigate('/login');
  };
  
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      // 更新localStorage中的用户数据
      const savedAuth = localStorage.getItem('auth');
      if (savedAuth) {
        try {
          const authData = JSON.parse(savedAuth);
          authData.user = updatedUser;
          localStorage.setItem('auth', JSON.stringify(authData));
        } catch (error) {
          console.error('Failed to update user data', error);
        }
      }
    }
  };
  
  return (
    <AuthContext.Provider
      value={{ isAuthenticated, login, logout, user, updateUser }}
    >
      <Toaster position="top-right" richColors />
      <AIAssistant />
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
        <Route path="/admin/knowledge-base" element={isAuthenticated ? <KnowledgeBase /> : <Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthContext.Provider>
  );
}
