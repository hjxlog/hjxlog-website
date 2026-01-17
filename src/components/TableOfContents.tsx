import React, { useState, useEffect } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ content }) => {
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // 解析markdown内容中的标题，排除代码块中的内容
    let processedContent = content;
    
    // 移除代码块（包括行内代码和代码块）
    // 先移除代码块 ```...```
    processedContent = processedContent.replace(/```[\s\S]*?```/g, '');
    // 再移除行内代码 `...`
    processedContent = processedContent.replace(/`[^`]*`/g, '');
    
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings: TocItem[] = [];
    let match;

    while ((match = headingRegex.exec(processedContent)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      
      headings.push({ id, text, level });
    }

    setToc(headings);
  }, [content]);

  useEffect(() => {
    // 监听滚动，高亮当前标题
    const handleScroll = () => {
      const headingElements = toc.map(item => 
        document.getElementById(item.id)
      ).filter(Boolean);

      let currentActiveId = '';
      
      for (let i = headingElements.length - 1; i >= 0; i--) {
        const element = headingElements[i];
        if (element && element.offsetTop <= window.scrollY + 100) {
          currentActiveId = element.id;
          break;
        }
      }

      setActiveId(currentActiveId);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // 初始调用

    return () => window.removeEventListener('scroll', handleScroll);
  }, [toc]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offsetTop = element.offsetTop - 100;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  };

  if (toc.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto hide-scrollbar pr-4">
      <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">
        目录
      </h3>
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
              paddingLeft: `${(item.level - 1) * 1 + 1}rem`
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