import { useContext, useState, useCallback, useMemo } from 'react';
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
    ]
  },
  {
    group: 'AI功能',
    tabs: [
      { key: 'knowledge', label: '知识库', icon: 'fas fa-brain' },
      { key: 'prompts', label: '提示词管理', icon: 'fas fa-magic' },
      { key: 'thoughts', label: '每日想法', icon: 'fas fa-sparkles', isExternalLink: true, externalPath: '/admin/thoughts' },
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

  const isDashboard = location.pathname === '/dashboard';
  const allTabs = useMemo(
    () => dashboardTabGroups.flatMap(group => group.tabs),
    []
  );

  const handleToggleMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const handleOpenHome = useCallback(() => {
    window.open('/', '_blank');
  }, []);

  const handleGoOverview = useCallback(() => {
    if (setActiveTab) {
      setActiveTab('overview');
    } else {
      navigate('/dashboard?tab=overview');
    }
  }, [navigate, setActiveTab]);

  const handleReturnToHome = useCallback(() => {
    window.open('/', '_blank');
    setIsMobileMenuOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setIsMobileMenuOpen(false);
  }, [logout]);

  // 移动端Dashboard页签
  const MobileDashboardTabs = () => {
    if (!isDashboard || !activeTab || !setActiveTab) return null;

    return (
      <div className="lg:hidden border-t border-gray-200 bg-white">
        <div className="flex overflow-x-auto px-4 py-3 gap-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {allTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 flex items-center px-4 py-2 rounded-full text-xs font-medium transition-all ${
                activeTab === tab.key
                  ? 'text-white bg-[#165DFF] shadow-md shadow-blue-100'
                  : 'text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-[#165DFF]'
              }`}
            >
              <i className={`${tab.icon} mr-2 text-sm`}></i>
              <span>{tab.label.replace('管理', '')}</span>
            </button>
          ))}
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
              onClick={handleOpenHome}
              className="text-2xl font-bold text-[#165DFF] hover:text-[#0E4BA4] transition-colors"
            >
              HJXLOG
            </button>
            <span className="ml-3 text-gray-400">|</span>
            <button 
              onClick={handleGoOverview}
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
              onClick={handleToggleMenu}
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
              {/* Mobile User Info */}
              <div>
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
                    onClick={handleReturnToHome}
                    className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-[#165DFF] transition-colors"
                  >
                    <i className="fas fa-home mr-2"></i>
                    返回前台
                  </button>
                  <button
                    onClick={handleLogout}
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
