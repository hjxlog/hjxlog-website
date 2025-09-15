import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';

export default function Nav() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useContext(AuthContext);
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

  return (
    <nav id="mainNav" className="fixed top-0 left-0 right-0 z-50 py-4 px-6 transition-all duration-300">
      <div className="container mx-auto flex items-center justify-between">
        <div className="text-2xl font-bold text-[#165DFF]">HJXLOG</div>
        
        <div className="hidden md:flex space-x-8">
          <a 
            href="#home" 
            className="text-slate-600 hover:text-[#165DFF] transition-colors font-medium"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('home')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            首页
          </a>
          <a 
            href="#about" 
            className="text-slate-600 hover:text-[#165DFF] transition-colors font-medium"
            onClick={(e) => {
              e.preventDefault();
              const element = document.getElementById('about');
              if (element) {
                const offsetTop = element.offsetTop - 80;
                window.scrollTo({ top: offsetTop, behavior: 'smooth' });
              }
            }}
          >
            关于
          </a>
          <a 
            href="#work" 
            className="text-slate-600 hover:text-[#165DFF] transition-colors font-medium"
            onClick={(e) => {
              e.preventDefault();
              const element = document.getElementById('work');
              if (element) {
                const offsetTop = element.offsetTop - 80;
                window.scrollTo({ top: offsetTop, behavior: 'smooth' });
              }
            }}
          >
            作品
          </a>
          <a 
            href="#blog" 
            className="text-slate-600 hover:text-[#165DFF] transition-colors font-medium"
            onClick={(e) => {
              e.preventDefault();
              const element = document.getElementById('blog');
              if (element) {
                const offsetTop = element.offsetTop - 80;
                window.scrollTo({ top: offsetTop, behavior: 'smooth' });
              }
            }}
          >
            博客
          </a>

        </div>
        
        <div className="hidden md:flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <button 
                onClick={() => navigate('/moments/management')} 
                className="px-4 py-2 text-slate-600 hover:text-[#165DFF] transition-colors font-medium"
              >
                动态管理
              </button>
              <button 
                onClick={() => navigate('/dashboard')} 
                className="px-4 py-2 gradient-btn rounded-full font-medium shadow-lg hover:shadow-xl transition-all"
              >
                仪表盘
              </button>
              <button 
                onClick={logout} 
                className="px-4 py-2 outline-btn rounded-full font-medium"
              >
                登出
              </button>
            </>
          ) : (
            <button 
              onClick={() => navigate('/login')} 
              className="px-4 py-2 gradient-btn rounded-full font-medium shadow-lg hover:shadow-xl transition-all"
            >
              登录
            </button>
          )}
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
            <a 
              href="#home" 
              className="text-slate-600 hover:text-[#165DFF] transition-colors font-medium"
              onClick={(e) => {
                e.preventDefault();
                setIsMenuOpen(false);
                document.getElementById('home')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              首页
            </a>
            <a 
              href="#about" 
              className="text-slate-600 hover:text-[#165DFF] transition-colors font-medium"
              onClick={(e) => {
                e.preventDefault();
                setIsMenuOpen(false);
                const element = document.getElementById('about');
                if (element) {
                  const offsetTop = element.offsetTop - 80;
                  window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                }
              }}
            >
              关于
            </a>
            <a 
              href="#work" 
              className="text-slate-600 hover:text-[#165DFF] transition-colors font-medium"
              onClick={(e) => {
                e.preventDefault();
                setIsMenuOpen(false);
                const element = document.getElementById('work');
                if (element) {
                  const offsetTop = element.offsetTop - 80;
                  window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                }
              }}
            >
              作品
            </a>
            <a 
              href="#blog" 
              className="text-slate-600 hover:text-[#165DFF] transition-colors font-medium"
              onClick={(e) => {
                e.preventDefault();
                setIsMenuOpen(false);
                const element = document.getElementById('blog');
                if (element) {
                  const offsetTop = element.offsetTop - 80;
                  window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                }
              }}
            >
              博客
            </a>

            {isAuthenticated ? (
              <>
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate('/moments/management');
                  }} 
                  className="text-slate-600 hover:text-[#165DFF] transition-colors font-medium"
                >
                  动态管理
                </button>
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate('/dashboard');
                  }} 
                  className="px-4 py-2 gradient-btn rounded-full font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  仪表盘
                </button>
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    logout();
                  }} 
                  className="px-4 py-2 outline-btn rounded-full font-medium"
                >
                  登出
                </button>
              </>
            ) : (
              <button 
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/login');
                }} 
                className="px-4 py-2 gradient-btn rounded-full font-medium shadow-lg hover:shadow-xl transition-all"
              >
                登录
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}