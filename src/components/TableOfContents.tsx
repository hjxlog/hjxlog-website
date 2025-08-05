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
    <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
        <i className="fas fa-list mr-2 text-[#165DFF]"></i>
        目录
      </h3>
      <nav className="space-y-1">
        {toc.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToHeading(item.id)}
            className={`block w-full text-left py-1 px-2 rounded text-sm transition-colors ${
              activeId === item.id
                ? 'bg-[#165DFF]/10 text-[#165DFF] font-medium'
                : 'text-slate-600 hover:text-[#165DFF] hover:bg-slate-50'
            }`}
            style={{ 
              paddingLeft: `${(item.level - 1) * 12 + 8}px`,
              fontSize: item.level === 1 ? '14px' : '13px'
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