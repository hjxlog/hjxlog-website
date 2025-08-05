import { useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';

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
      <MDEditor
        value={content}
        onChange={handleChange}
        preview="edit"
        hideToolbar={false}
        visibleDragBar={false}
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
    </div>
  );
}

// 预览组件
export function MarkdownPreview({ content }: { content: string }) {
  return (
    <div className="markdown-preview">
      <MDEditor.Markdown source={content} style={{ whiteSpace: 'pre-wrap' }} />
    </div>
  );
}