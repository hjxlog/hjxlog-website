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
  const handleNavClick = (section: string) => {
    const scrollToSection = () => {
      const element = document.getElementById(section);
      if (element) {
        const extraOffset = 80; // 额外间距，稍微加大一点以避开导航栏
        
        const offsetTop = element.offsetTop  - extraOffset;
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    };

    if (location.pathname !== '/') {
      // 如果不在首页，先跳转到首页，然后滚动到对应部分
      navigate('/');
      setTimeout(scrollToSection, 100);
    } else {
      // 如果在首页，直接滚动到对应部分
      scrollToSection();
    }
  };

  // 处理作品点击
  const handleWorksClick = () => {
    if (location.pathname === '/') {
      // 在首页，跳转到作品section (假设作品部分有id='works')
      // 但目前Home.tsx里是AppleWorksScroll，我们可能需要给它加个ID
      navigate('/works'); // 暂时直接跳转路由，保持行为一致
    } else {
      // 在其他页面，跳转到作品页面
      navigate('/works');
    }
  };

  // 处理博客点击
  const handleBlogClick = () => {
      navigate('/blogs');
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
        <div className="text-2xl font-bold text-[#165DFF] cursor-pointer" onClick={() => {
          if (location.pathname === '/') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            navigate('/');
          }
        }}>
          HJXLOG
        </div>
        
        {/* 右侧：导航菜单 */}
        <div className="hidden md:flex items-center space-x-8">
          <button 
            className="text-slate-600 hover:text-[#165DFF] transition-colors font-medium"
            onClick={() => {
              if (location.pathname === '/') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                navigate('/');
              }
            }}
          >
            首页
          </button>
          <button 
            className="text-slate-600 hover:text-[#165DFF] transition-colors font-medium"
            onClick={handleWorksClick}
          >
            作品
          </button>
          <button 
            className="text-slate-600 hover:text-[#165DFF] transition-colors font-medium"
            onClick={handleBlogClick}
          >
            博客
          </button>
          <button 
            className="text-slate-600 hover:text-[#165DFF] transition-colors font-medium"
            onClick={() => navigate('/photos')}
          >
            摄影
          </button>
          <button 
            className="text-slate-600 hover:text-[#165DFF] transition-colors font-medium"
            onClick={() => navigate('/moments')}
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
              onClick={() => {
                setIsMenuOpen(false);
                if (location.pathname === '/') {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  navigate('/');
                }
              }}
            >
              首页
            </button>
            <button 
              className="text-slate-600 hover:text-[#165DFF] transition-colors font-medium text-left"
              onClick={() => {
                setIsMenuOpen(false);
                handleWorksClick();
              }}
            >
              作品
            </button>
            <button 
              className="text-slate-600 hover:text-[#165DFF] transition-colors font-medium text-left"
              onClick={() => {
                setIsMenuOpen(false);
                handleBlogClick();
              }}
            >
              博客
            </button>
            <button 
              className="text-slate-600 hover:text-[#165DFF] transition-colors font-medium text-left"
              onClick={() => {
                setIsMenuOpen(false);
                navigate('/photos');
              }}
            >
              摄影
            </button>
            <button 
              className="text-slate-600 hover:text-[#165DFF] transition-colors font-medium text-left"
              onClick={() => {
                setIsMenuOpen(false);
                navigate('/moments');
              }}
            >
              动态
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}