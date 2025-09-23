import { useContext, useState } from 'react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    { key: 'logs', label: '日志管理', icon: 'fas fa-file-alt' },
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
              onClick={() => window.open('/', '_blank')}
              className="text-2xl font-bold text-[#165DFF] hover:text-[#0E4BA4] transition-colors"
            >
              HJXLOG
            </button>
            <span className="ml-3 text-gray-400">|</span>
            <span className="ml-3 text-gray-600 font-medium">管理后台</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex md:items-center md:space-x-4 lg:space-x-8">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center px-2 lg:px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'text-[#165DFF] bg-blue-50'
                    : 'text-gray-600 hover:text-[#165DFF] hover:bg-gray-50'
                }`}
              >
                <i className={`${item.icon} mr-1 lg:mr-2`}></i>
                {item.label}
              </button>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex md:items-center md:space-x-2 lg:space-x-4">
            <div className="flex items-center space-x-2 lg:space-x-3">
              <img
                className="h-7 w-7 lg:h-8 lg:w-8 rounded-full"
                src={user?.avatar || '/default-avatar.png'}
                alt="用户头像"
              />
              <div className="text-sm hidden lg:block">
                <div className="font-medium text-gray-900">{user?.username}</div>
                <div className="text-gray-500">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-gray-500 hover:text-gray-700 px-2 lg:px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <i className="fas fa-sign-out-alt mr-1 lg:mr-2"></i>
              <span className="hidden lg:inline">退出</span>
              <span className="lg:hidden">退出</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="切换菜单"
            >
              <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'text-[#165DFF] bg-blue-50'
                      : 'text-gray-600 hover:text-[#165DFF] hover:bg-gray-50'
                  }`}
                >
                  <i className={`${item.icon} mr-3 w-4 text-center`}></i>
                  {item.label}
                </button>
              ))}
              
              {/* Mobile User Info */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex items-center px-3 py-2 mb-2">
                  <div className="w-8 h-8 bg-[#165DFF] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-white text-sm font-medium">
                      {user?.username?.charAt(0).toUpperCase() || 'A'}
                    </span>
                  </div>
                  <div className="text-sm min-w-0 flex-1">
                    <div className="font-medium text-gray-900 truncate">{user?.username || 'Admin'}</div>
                    <div className="text-gray-500 truncate">{user?.email || 'admin@example.com'}</div>
                  </div>
                </div>
                
                {/* Mobile Action Buttons */}
                <div className="flex items-center justify-around px-3 py-2 bg-gray-50 rounded-md mx-3">
                  <button
                    onClick={() => {
                      window.open('/', '_blank');
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-[#165DFF] transition-colors"
                  >
                    <i className="fas fa-home mr-2"></i>
                    返回前台
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <i className="fas fa-sign-out-alt mr-2"></i>
                    退出登录
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Tabs */}
        {isDashboard && activeTab && setActiveTab && (
          <div className="border-t border-gray-200">
            <div className="flex space-x-2 sm:space-x-8 overflow-x-auto scrollbar-hide px-2 sm:px-0">
              {dashboardTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.key
                      ? 'text-[#165DFF] border-[#165DFF]'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <i className={`${tab.icon} mr-1 sm:mr-2 text-xs sm:text-sm`}></i>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.replace('管理', '')}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}