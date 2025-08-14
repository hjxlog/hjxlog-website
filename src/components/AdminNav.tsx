import { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';

interface AdminNavProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export default function AdminNav({ activeTab, setActiveTab }: AdminNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  const navItems = [
    { path: '/dashboard', label: '仪表盘', icon: 'fas fa-tachometer-alt' },
    { path: '/profile', label: '个人资料', icon: 'fas fa-user' },
  ];

  // Dashboard页面内的标签页
  const dashboardTabs = [
    { key: 'overview', label: '概览', icon: 'fas fa-chart-pie' },
    { key: 'works', label: '作品管理', icon: 'fas fa-briefcase' },
    { key: 'blogs', label: '博客管理', icon: 'fas fa-blog' },
    { key: 'moments', label: '动态管理', icon: 'fas fa-camera' },
    { key: 'comments', label: '评论管理', icon: 'fas fa-comments' },
    { key: 'messages', label: '消息管理', icon: 'fas fa-envelope' },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isDashboard = location.pathname === '/dashboard';

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="w-full px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/')}
              className="text-2xl font-bold text-[#165DFF] hover:text-[#0E4BA4] transition-colors"
            >
              HJXLOG
            </button>
            <span className="ml-3 text-gray-400">|</span>
            <span className="ml-3 text-gray-600 font-medium">管理后台</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'text-[#165DFF] bg-blue-50'
                    : 'text-gray-600 hover:text-[#165DFF] hover:bg-gray-50'
                }`}
              >
                <i className={`${item.icon} mr-2`}></i>
                {item.label}
              </button>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#165DFF] rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.username?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-900">{user?.username || 'Admin'}</div>
                <div className="text-gray-500">{user?.email || 'admin@example.com'}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="返回前台"
              >
                <i className="fas fa-external-link-alt"></i>
              </button>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="退出登录"
              >
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <i className="fas fa-bars"></i>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <div className="flex flex-col space-y-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'text-[#165DFF] bg-blue-50'
                    : 'text-gray-600 hover:text-[#165DFF] hover:bg-gray-50'
                }`}
              >
                <i className={`${item.icon} mr-2`}></i>
                {item.label}
              </button>
            ))}
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex items-center px-3 py-2">
                <div className="w-8 h-8 bg-[#165DFF] rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm font-medium">
                    {user?.username?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{user?.username || 'Admin'}</div>
                  <div className="text-gray-500">{user?.email || 'admin@example.com'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Tabs */}
        {isDashboard && activeTab && setActiveTab && (
          <div className="border-t border-gray-200">
            <div className="flex space-x-8 overflow-x-auto">
              {dashboardTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'text-[#165DFF] border-[#165DFF]'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <i className={`${tab.icon} mr-2`}></i>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}