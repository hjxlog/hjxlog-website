import { createContext, useContext } from "react";

// 用户类型定义
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
}

// 认证上下文类型
export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (remember?: boolean) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

// 默认上下文值
const defaultContextValue: AuthContextType = {
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {}
};

// 创建认证上下文
export const AuthContext = createContext<AuthContextType>(defaultContextValue);

// useAuth hook - 直接从 authContext 导出
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContext.Provider');
  }
  return context;
}