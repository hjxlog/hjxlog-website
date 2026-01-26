import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';

// 导航项配置
interface NavItem {
  label: string;
  href?: string;  // 页面内锚点
  path?: string;  // 路由路径
}

// 滚动到指定元素
const scrollToElement = (elementId: string, offset: number = 80) => {
  if (elementId === 'home') {
    document.getElementById('home')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    const element = document.getElementById(elementId);
    if (element) {
      const offsetTop = element.offsetTop - offset;
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
  }
};

export default function Nav() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 导航项配置
  const navItems: NavItem[] = useMemo(() => [
    { label: '首页', href: 'home' },
    { label: '关于', href: 'about' },
    { label: '作品', href: 'work' },
    { label: '博客', href: 'blog' },
    { label: '摄影', path: '/photos' },
  ], []);

  // 导航栏滚动效果
  useEffect(() => {
    const nav = document.getElementById('mainNav');
    if (!nav) return;

    const handleScroll = () => {
      nav.classList.toggle('nav-scrolled', window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 处理导航项点击
  const handleNavClick = useCallback((item: NavItem, closeMenu: boolean = false) => {
    if (closeMenu) setIsMenuOpen(false);
    if (item.path) {
      navigate(item.path);
    } else if (item.href) {
      scrollToElement(item.href);
    }
  }, [navigate]);

  // 导航按钮样式
  const navButtonClass = "text-slate-600 hover:text-[#165DFF] transition-colors font-medium";
  const gradientBtnClass = "px-4 py-2 gradient-btn rounded-full font-medium shadow-lg hover:shadow-xl transition-all";
  const outlineBtnClass = "px-4 py-2 outline-btn rounded-full font-medium";

  // 渲染导航项组件
  const renderNavItem = (item: NavItem, closeMenu: boolean = false) => (
    <button
      key={item.label}
      className={`${navButtonClass}${closeMenu ? ' text-left' : ''}`}
      onClick={() => handleNavClick(item, closeMenu)}
    >
      {item.label}
    </button>
  );

  // 渲染认证按钮
  const renderAuthButtons = (isMobile: boolean = false) => {
    const handleClick = (action: () => void) => {
      if (isMobile) setIsMenuOpen(false);
      action();
    };

    if (isAuthenticated) {
      return (
        <>
          <button
            onClick={() => handleClick(() => navigate('/moments/management'))}
            className={navButtonClass}
          >
            动态管理
          </button>
          <button
            onClick={() => handleClick(() => navigate('/dashboard'))}
            className={gradientBtnClass}
          >
            仪表盘
          </button>
          <button
            onClick={() => handleClick(logout)}
            className={outlineBtnClass}
          >
            登出
          </button>
        </>
      );
    }

    return (
      <button
        onClick={() => handleClick(() => navigate('/login'))}
        className={gradientBtnClass}
      >
        登录
      </button>
    );
  };

  return (
    <nav id="mainNav" className="fixed top-0 left-0 right-0 z-50 py-4 px-6 transition-all duration-300">
      <div className="container mx-auto flex items-center justify-between">
        <div className="text-2xl font-bold text-[#165DFF]">HJXLOG</div>

        {/* 桌面端导航 */}
        <div className="hidden md:flex space-x-8">
          {navItems.map(item => renderNavItem(item))}
        </div>

        {/* 桌面端认证按钮 */}
        <div className="hidden md:flex items-center space-x-4">
          {renderAuthButtons()}
        </div>

        {/* 移动端菜单按钮 */}
        <button
          className="md:hidden text-slate-600"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <i className={isMenuOpen ? 'fas fa-times text-2xl' : 'fas fa-bars text-2xl'}></i>
        </button>
      </div>

      {/* 移动端菜单 */}
      {isMenuOpen && (
        <div className="md:hidden mt-4 pb-4">
          <div className="flex flex-col space-y-4">
            {navItems.map(item => renderNavItem(item, true))}
            {renderAuthButtons(true)}
          </div>
        </div>
      )}
    </nav>
  );
}
