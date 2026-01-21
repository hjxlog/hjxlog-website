import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { ghcolors } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { Copy, Check, ExternalLink } from 'lucide-react';

// 代码块组件 - Typora 风格
const CodeBlock = ({ language, children }: { language: string; children: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-md bg-[#f8f8f8] border border-[#e7eaed] group">
      {/* Copy Button (Only visible on hover) */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
        {language && (
           <span className="text-xs text-slate-400 font-mono py-1 px-2 select-none">
             {language}
           </span>
        )}
        <button 
          onClick={handleCopy}
          className="p-1 rounded bg-white border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors shadow-sm"
          title="Copy code"
        >
          {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
        </button>
      </div>
      
      {/* Code Content */}
      <div className="relative overflow-hidden rounded-md">
        <SyntaxHighlighter
          language={language || 'text'}
          style={ghcolors}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent', // Let container bg show
            fontSize: '0.9em',
            lineHeight: '1.5',
            fontFamily: "\"Roboto Mono\", \"Source Sans Pro\", Monaco, courier, monospace",
          }}
          showLineNumbers={true}
          wrapLines={true}
          lineNumberStyle={{
             minWidth: '2.5em',
             paddingRight: '1em',
             color: '#bbb',
             textAlign: 'right',
             userSelect: 'none'
          }}
        >
          {children}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};


// Markdown 包装组件
export const MarkdownRenderer = ({ content, className = "" }: { content: string; className?: string }) => {
  // 生成唯一ID用于标题锚点
  const idCounts: Record<string, number> = {};
  const getUniqueId = (text: string) => {
    let id = text.toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    if (idCounts[id]) {
      idCounts[id]++;
      id = `${id}-${idCounts[id]}`;
    } else {
      idCounts[id] = 1;
    }
    return id;
  };

  const getNodeText = (node: any): string => {
    if (['string', 'number'].includes(typeof node)) return node.toString();
    if (node instanceof Array) return node.map(getNodeText).join('');
    if (typeof node === 'object' && node) {
       if (node.props && node.props.children) return getNodeText(node.props.children);
    }
    return '';
  };

  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          // 移除 pre 的默认样式，让 code 接管
          pre: ({ children }: any) => <>{children}</>,
          
          // 代码块与行内代码处理
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const content = String(children).replace(/\n$/, '');
            const isMultiLine = content.includes('\n');
            
            // 智能判断：如果是块级代码，但只有单行且未指定特定语言（或是 text），
            // 则降级为行内样式，避免"杀鸡用牛刀"的视觉负担（例如单独一行的文件名 `SKILL.md`）
            const shouldRenderAsBlock = !inline && (isMultiLine || (language && language !== 'text'));
            
            return shouldRenderAsBlock ? (
              <CodeBlock language={language} children={content} />
            ) : (
              // Typora 风格行内代码
              <code className="px-1.5 py-0.5 mx-0.5 rounded-[3px] bg-[#f3f4f4] text-[#444] text-[0.9em] font-mono border border-[#e7eaed] before:content-none after:content-none" {...props}>
                {children}
              </code>
            );
          },

          // GitHub 风格列表
          ul: ({ children }: any) => (
            <ul className="list-disc list-outside ml-2 my-4 text-[#24292f] [&_p]:!my-0">
              {children}
            </ul>
          ),
          ol: ({ children }: any) => (
            <ol className="list-decimal list-outside ml-2 my-4 text-[#24292f] [&_p]:!my-0">
              {children}
            </ol>
          ),
          li: ({ children }: any) => (
            <li className="pl-1 leading-7 text-[#24292f] my-2">
              {children}
            </li>
          ),

          // 图片
          img({ src, alt, ...props }: any) {
            return (
              <div className="my-6">
                <div className="relative overflow-hidden group bg-transparent">
                  <img 
                    src={src} 
                    alt={alt} 
                    className="max-w-full h-auto object-contain border border-slate-100 rounded-sm"
                    {...props}
                  />
                </div>
                {alt && (
                  <p className="text-center text-sm text-slate-500 mt-2">
                    {alt}
                  </p>
                )}
              </div>
            );
          },
          // 链接
          a({ href, children, ...props }: any) {
            const isInternal = href?.startsWith('/') || href?.includes(window.location.hostname);
            return (
              <a 
                href={href} 
                target={isInternal ? "_self" : "_blank"}
                rel={isInternal ? "" : "noopener noreferrer"}
                className="text-[#0969da] hover:underline decoration-auto underline-offset-0"
                {...props}
              >
                {children}
                {!isInternal && <ExternalLink size={10} className="inline ml-0.5 opacity-70" />}
              </a>
            );
          },
          // 引用块
          blockquote({ children }: any) {
            return (
              <blockquote className="border-l-4 border-[#d0d7de] pl-4 py-1 my-4 text-[#57606a] italic">
                {children}
              </blockquote>
            );
          },
          // 分割线
          hr: () => <hr className="h-px my-4 bg-[#e7e7e7] border-0" />,
          // 标题
          h1: ({ children, ...props }: any) => {
            const text = getNodeText(children);
            const id = getUniqueId(text);
            return <h1 id={id} className="text-3xl font-semibold mt-8 mb-4 pb-2 border-b border-[#d0d7de] flex items-center gap-2 scroll-mt-24 text-[#24292f]" {...props}>{children}</h1>;
          },
          h2: ({ children, ...props }: any) => {
            const text = getNodeText(children);
            const id = getUniqueId(text);
            return <h2 id={id} className="text-2xl font-semibold mt-6 mb-4 pb-1 border-b border-[#d0d7de] flex items-center gap-2 scroll-mt-24 text-[#24292f]" {...props}>{children}</h2>;
          },
          h3: ({ children, ...props }: any) => {
            const text = getNodeText(children);
            const id = getUniqueId(text);
            return <h3 id={id} className="text-xl font-semibold mt-6 mb-3 flex items-center gap-2 scroll-mt-24 text-[#24292f]" {...props}>{children}</h3>;
          },
          p: ({ children }: any) => <p className="my-4 leading-7 text-[#24292f]">{children}</p>,
          // 表格
          table: ({ children }: any) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse block overflow-x-auto w-max">{children}</table>
            </div>
          ),
          thead: ({ children }: any) => <thead className="bg-[#f6f8fa]">{children}</thead>,
          th: ({ children }: any) => <th className="px-4 py-3 text-left font-semibold text-[#24292f] border border-[#d0d7de]">{children}</th>,
          td: ({ children }: any) => <td className="px-4 py-3 text-[#24292f] border border-[#d0d7de]">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
