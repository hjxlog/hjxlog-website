import React, { useState, useEffect, useMemo, useCallback } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
  displayLevel?: number;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
  showHeader?: boolean;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ content, className = "", showHeader = true }) => {
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // 改为直接扫描 DOM 生成目录，确保 ID 与页面绝对一致
    const generateTocFromDom = () => {
      const contentElement = document.getElementById('blog-content');
      if (!contentElement) return;

      const headingElements = Array.from(contentElement.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      const headings: TocItem[] = headingElements.map(el => ({
        id: el.id,
        text: (el as HTMLElement).innerText,
        level: parseInt(el.tagName.substring(1), 10)
      }));

      // 智能处理：如果第一个标题是H1且是唯一的H1，则过滤掉
      if (headings.length > 0 && headings[0].level === 1) {
         const h1Count = headings.filter(h => h.level === 1).length;
         if (h1Count === 1 || (headings.length > 1 && headings[1].level === 2)) {
           headings.shift();
         }
      }
      
      // 计算最小层级，用于归一化缩进
      if (headings.length > 0) {
        const minLevel = Math.min(...headings.map(h => h.level));
        headings.forEach(h => {
          h.displayLevel = h.level - minLevel;
        });
      }

      setToc(headings);
    };

    // 使用 MutationObserver 监听内容变化
    const observer = new MutationObserver(generateTocFromDom);
    const contentElement = document.getElementById('blog-content');
    
    if (contentElement) {
      observer.observe(contentElement, { childList: true, subtree: true });
      generateTocFromDom(); // 初始执行
    } else {
      // 如果还没挂载，延迟尝试
      const timer = setTimeout(generateTocFromDom, 500);
      return () => clearTimeout(timer);
    }

    return () => observer.disconnect();
  }, [content]); // 当 content 变化时也会重新触发（作为兜底）

  const headingElements = useMemo(() => (
    toc
      .map(item => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[]
  ), [toc]);

  const handleScroll = useCallback(() => {
    if (headingElements.length === 0) {
      setActiveId('');
      return;
    }

    let currentActiveId = '';
    const scrollPosition = window.scrollY;

    for (let i = headingElements.length - 1; i >= 0; i--) {
      const element = headingElements[i];
      if (element && element.offsetTop <= scrollPosition + 100) {
        currentActiveId = element.id;
        break;
      }
    }

    setActiveId(currentActiveId);
  }, [headingElements]);

  useEffect(() => {
    // 监听滚动，高亮当前标题
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // 延迟初始调用，等待DOM完全渲染
    const timer = setTimeout(handleScroll, 100);

    return () => {
        window.removeEventListener('scroll', handleScroll);
        clearTimeout(timer);
    };
  }, [handleScroll]);

  const scrollToHeading = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offsetTop = element.offsetTop - 100;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  }, []);

  if (toc.length === 0) {
    return null;
  }

  return (
    <div className={`max-h-[calc(100vh-8rem)] overflow-y-auto hide-scrollbar pr-4 ${className}`}>
      {showHeader && (
        <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">
          目录
        </h3>
      )}
      <nav className="space-y-1 relative">
        {/* 连接线 */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200" />
        
        {toc.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToHeading(item.id)}
            className={`block w-full text-left py-1.5 pl-4 text-sm transition-all border-l-2 -ml-px ${
              activeId === item.id
                ? 'border-blue-500 text-blue-600 font-medium'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
            style={{
              paddingLeft: `${(item.displayLevel || 0) * 1 + 1}rem`
            }}
          >
            {item.text}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default TableOfContents;
