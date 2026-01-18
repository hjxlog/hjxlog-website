import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { dashboardTabGroups } from './AdminNav';

interface DashboardSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function DashboardSidebar({ activeTab, setActiveTab }: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <aside
      className={`hidden lg:flex flex-col bg-white border-r border-gray-200 flex-shrink-0 transition-all duration-300 ease-in-out sticky top-16 h-[calc(100vh-4rem)] z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex-1 overflow-y-auto py-6 custom-scrollbar">
        {/* 折叠按钮 */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-6 right-[-12px] z-10 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-[#165DFF] hover:border-[#165DFF] shadow-sm transition-all duration-200"
          title={isCollapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          <i className={`fas fa-chevron-${isCollapsed ? 'right' : 'left'} text-xs transform transition-transform duration-300`}></i>
        </button>

        <div className="space-y-8 px-4">
          {dashboardTabGroups.map((group) => (
            <div key={group.group}>
              {!isCollapsed && (
                <h3 className="px-3 mb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {group.group}
                </h3>
              )}
              {isCollapsed && (
                <div className="h-px bg-gray-100 mx-2 mb-3" />
              )}
              <div className="space-y-1.5">
                {group.tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative group w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.key
                        ? 'text-white bg-gradient-to-r from-[#165DFF] to-[#3B82F6] shadow-md shadow-blue-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-[#165DFF]'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? tab.label : undefined}
                  >
                    <i
                      className={`${tab.icon} text-lg transition-colors duration-200 ${
                        isCollapsed ? 'mx-auto' : 'mr-3'
                      } ${activeTab === tab.key ? 'text-white' : 'text-gray-400 group-hover:text-[#165DFF]'}`}
                    ></i>
                    {!isCollapsed && <span>{tab.label}</span>}
                    
                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                        {tab.label}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部用户区域 */}
      <div className={`p-4 border-t border-gray-100 bg-gray-50/50 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
          {/* 头像 */}
          <div className="relative group cursor-pointer" onClick={() => navigate('/profile')}>
            <img
              className="h-9 w-9 rounded-full border border-gray-200 shadow-sm transition-transform group-hover:scale-105"
              src={user?.avatar || '/default-avatar.png'}
              alt="User"
            />
            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white"></div>
          </div>

          {/* 用户信息和操作按钮 (仅展开时显示) */}
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="truncate pr-2">
                  <p className="text-sm font-semibold text-gray-700 truncate">{user?.username || 'Admin'}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email || 'admin@example.com'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 展开状态下的操作按钮栏 */}
        {!isCollapsed && (
          <div className="mt-3 flex space-x-1">
             <button
              onClick={() => navigate('/profile')}
              className="flex-1 flex items-center justify-center px-2 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:text-[#165DFF] hover:border-[#165DFF] hover:bg-blue-50 transition-all"
              title="个人资料"
            >
              <i className="fas fa-user-cog mr-1.5"></i>设置
            </button>
            <button
              onClick={logout}
              className="flex-1 flex items-center justify-center px-2 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:text-red-500 hover:border-red-500 hover:bg-red-50 transition-all"
              title="退出登录"
            >
              <i className="fas fa-sign-out-alt mr-1.5"></i>退出
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
