import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function PublicNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 导航栏滚动效果
  const [isScrolled, setIsScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 处理导航点击
  const handleNavClick = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
    
    // 如果是跳转到首页，滚动到顶部
    if (path === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav 
      id="mainNav" 
      className={`fixed top-0 left-0 right-0 py-4 px-6 transition-all duration-300 z-50 ${
        isScrolled || isMenuOpen ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/50' : 'bg-white/0'
      }`}
    >
      <div className="container mx-auto flex items-center justify-between">
        {/* 左侧：Logo */}
        <div 
          className="text-2xl font-bold text-[#165DFF] cursor-pointer" 
          onClick={() => handleNavClick('/')}
        >
          HJXLOG
        </div>
        
        {/* 右侧：导航菜单 */}
        <div className="hidden md:flex items-center space-x-8">
          <button 
            className="text-slate-600 hover:text-[#165DFF] transition-colors font-medium"
            onClick={() => handleNavClick('/')}
          >
            首页
          </button>
          <button 
            className="text-slate-600 hover:text-[#165DFF] transition-colors font-medium"
            onClick={() => handleNavClick('/works')}
          >
            作品
          </button>
          <button 
            className="text-slate-600 hover:text-[#165DFF] transition-colors font-medium"
            onClick={() => handleNavClick('/blogs')}
          >
            博客
          </button>
          <button 
            className="text-slate-600 hover:text-[#165DFF] transition-colors font-medium"
            onClick={() => handleNavClick('/photos')}
          >
            摄影
          </button>
          <button 
            className="text-slate-600 hover:text-[#165DFF] transition-colors font-medium"
            onClick={() => handleNavClick('/moments')}
          >
            动态
          </button>

        </div>
        
        <button 
          className="md:hidden text-slate-600"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <i className={isMenuOpen ? 'fas fa-times text-2xl' : 'fas fa-bars text-2xl'}></i>
        </button>
      </div>
      
      {isMenuOpen && (
        <div className="md:hidden mt-4 pb-4">
          <div className="flex flex-col space-y-4">
            <button 
              className="text-slate-600 hover:text-[#165DFF] transition-colors font-medium text-left"
              onClick={() => handleNavClick('/')}
            >
              首页
            </button>
            <button 
              className="text-slate-600 hover:text-[#165DFF] transition-colors font-medium text-left"
              onClick={() => handleNavClick('/works')}
            >
              作品
            </button>
            <button 
              className="text-slate-600 hover:text-[#165DFF] transition-colors font-medium text-left"
              onClick={() => handleNavClick('/blogs')}
            >
              博客
            </button>
            <button 
              className="text-slate-600 hover:text-[#165DFF] transition-colors font-medium text-left"
              onClick={() => handleNavClick('/photos')}
            >
              摄影
            </button>
            <button 
              className="text-slate-600 hover:text-[#165DFF] transition-colors font-medium text-left"
              onClick={() => handleNavClick('/moments')}
            >
              动态
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}