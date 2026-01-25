import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const useBackToTop = () => {
  const location = useLocation();
  const cleanupRef = useRef<(() => void) | null>(null);
  
  useEffect(() => {
    // 清理之前的事件监听器
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    
    // 页面路由变化时，滚动到顶部
    window.scrollTo({ top: 0, behavior: 'auto' });

    const initializeBackToTop = () => {
      const backToTop = document.getElementById('backToTop');
      if (!backToTop) {
        return false;
      }
      
      const scrollHandler = () => {
        const scrollY = window.scrollY;
        if (scrollY > 100) {
          backToTop.style.opacity = '1';
          backToTop.style.visibility = 'visible';
        } else {
          backToTop.style.opacity = '0';
          backToTop.style.visibility = 'hidden';
        }
      };

      const clickHandler = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      };
      
      // 添加事件监听器
      window.addEventListener('scroll', scrollHandler, { passive: true });
      backToTop.addEventListener('click', clickHandler);
      
      // 初始检查
      scrollHandler();
      
      // 设置清理函数
      cleanupRef.current = () => {
        window.removeEventListener('scroll', scrollHandler);
        backToTop.removeEventListener('click', clickHandler);
      };
      
      return true;
    };

    // 使用 requestAnimationFrame 确保DOM已渲染
    const initWithDelay = () => {
      requestAnimationFrame(() => {
        if (!initializeBackToTop()) {
          // 如果还是失败，再尝试几次
          let attempts = 0;
          const retryInterval = setInterval(() => {
            attempts++;
            if (initializeBackToTop() || attempts >= 10) {
              clearInterval(retryInterval);
            }
          }, 100);
        }
      });
    };
    
    initWithDelay();
    
    // 清理函数
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [location.pathname]);
};
