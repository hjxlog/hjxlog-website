import { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';

interface AdminNavProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

// Dashboard页面内的标签页 - 分组显示 (移到函数外部以便导出)
export const dashboardTabGroups = [
  {
    group: '内容管理',
    tabs: [
      { key: 'overview', label: '概览', icon: 'fas fa-chart-pie' },
      { key: 'works', label: '作品管理', icon: 'fas fa-briefcase' },
      { key: 'blogs', label: '博客管理', icon: 'fas fa-blog' },
      { key: 'photos', label: '摄影管理', icon: 'fas fa-images' },
    ]
  },
  {
    group: '互动管理',
    tabs: [
      { key: 'moments', label: '动态管理', icon: 'fas fa-camera' },
      { key: 'comments', label: '评论管理', icon: 'fas fa-comments' },
    ]
  },
  {
    group: 'AI功能',
    tabs: [
      { key: 'knowledge', label: '知识库', icon: 'fas fa-brain' },
      { key: 'prompts', label: '提示词管理', icon: 'fas fa-magic' },
    ]
  },
  {
    group: '系统',
    tabs: [
      { key: 'logs', label: '日志管理', icon: 'fas fa-file-alt' },
    ]
  },
];

export default function AdminNav({ activeTab, setActiveTab }: AdminNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: '仪表盘', icon: 'fas fa-tachometer-alt' },
    { path: '/profile', label: '个人资料', icon: 'fas fa-user' },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isDashboard = location.pathname === '/dashboard';

  // 移动端Dashboard页签
  const MobileDashboardTabs = () => {
    if (!isDashboard || !activeTab || !setActiveTab) return null;

    return (
      <div className="lg:hidden border-t border-gray-200 bg-white">
        <div className="px-2 py-3">
          <div className="space-y-4">
            {dashboardTabGroups.map((group) => (
              <div key={group.group}>
                <h3 className="px-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {group.group}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {group.tabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex flex-col items-center justify-center px-2 py-3 rounded-lg text-xs font-medium transition-colors ${
                        activeTab === tab.key
                          ? 'text-[#165DFF] bg-blue-50'
                          : 'text-gray-600 hover:text-[#165DFF] hover:bg-gray-50'
                      }`}
                    >
                      <i className={`${tab.icon} text-lg mb-1`}></i>
                      <span className="text-center">{tab.label.replace('管理', '')}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
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
            <button 
              onClick={() => {
                if (setActiveTab) {
                  setActiveTab('overview');
                } else {
                  navigate('/dashboard?tab=overview');
                }
              }}
              className="ml-3 text-gray-600 font-medium hidden sm:inline hover:text-[#165DFF] transition-colors cursor-pointer"
            >
              管理后台
            </button>
          </div>

          {/* Navigation Links - Mobile only logic handles this now */}
          <div className="hidden md:flex md:items-center md:space-x-4 lg:space-x-8">
            {/* 顶部导航已移除，功能移至侧边栏 */}
          </div>

          {/* User Menu - Removed from desktop, moved to sidebar */}
          <div className="hidden md:flex md:items-center md:space-x-2 lg:space-x-4">
            {/* 用户菜单已移至侧边栏底部 */}
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

        {/* Mobile Dashboard Tabs */}
        <MobileDashboardTabs />
      </div>
    </nav>
  );
}
