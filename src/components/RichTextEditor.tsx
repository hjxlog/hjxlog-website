import { useState, useEffect, lazy, Suspense } from 'react';
import '@uiw/react-md-editor/markdown-editor.css';

// 动态导入 MDEditor
const MDEditor = lazy(() => import('@uiw/react-md-editor'));

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  height?: number;
}

export default function RichTextEditor({ 
  value = '', 
  onChange, 
  placeholder = '请输入内容...',
  height = 400 
}: RichTextEditorProps) {
  const [content, setContent] = useState(value);

  const handleChange = (val?: string) => {
    const newValue = val || '';
    setContent(newValue);
    onChange?.(newValue);
  };

  return (
    <div className="rich-text-editor">
      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded">加载编辑器...</div>}>
        <MDEditor
          value={content}
          onChange={handleChange}
          preview="edit"
          hideToolbar={false}
          visibleDragbar={false}
          textareaProps={{
            placeholder,
            style: {
              fontSize: 14,
              lineHeight: 1.6,
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
            }
          }}
          height={height}
          data-color-mode="light"
        />
      </Suspense>
    </div>
  );
}

// 预览组件
export function MarkdownPreview({ content }: { content: string }) {
  const [MarkdownComponent, setMarkdownComponent] = useState<any>(null);
  
  useEffect(() => {
    import('@uiw/react-md-editor').then(module => {
      setMarkdownComponent(() => module.default.Markdown);
    });
  }, []);
  
  if (!MarkdownComponent) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded">加载预览...</div>;
  }
  
  return (
    <div className="markdown-preview">
      <MarkdownComponent source={content} style={{ whiteSpace: 'pre-wrap' }} />
    </div>
  );
}