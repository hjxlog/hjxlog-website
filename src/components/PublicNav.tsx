import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function PublicNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 导航栏滚动效果
  useEffect(() => {
    const nav = document.getElementById('mainNav');
    if (!nav) return;
    
    const handleScroll = () => {
      if (window.scrollY > 50) {
        nav.classList.add('nav-scrolled');
      } else {
        nav.classList.remove('nav-scrolled');
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 处理导航点击
  const handleNavClick = (section: string) => {
    const scrollToSection = () => {
      const element = document.getElementById(section);
      if (element) {
        const extraOffset = 64; // 额外间距
        
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
      // 在首页，跳转到作品section
      handleNavClick('work');
    } else {
      // 在其他页面，跳转到作品页面
      navigate('/works');
    }
  };

  // 处理博客点击
  const handleBlogClick = () => {
    if (location.pathname === '/') {
      // 在首页，跳转到博客section
      handleNavClick('blog');
    } else {
      // 在其他页面，跳转到博客页面
      navigate('/blogs');
    }
  };

  return (
    <nav id="mainNav" className="fixed top-0 left-0 right-0 py-4 px-6 transition-all duration-300">
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