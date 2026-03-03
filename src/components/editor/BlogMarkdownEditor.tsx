import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Markdown } from '@tiptap/markdown';
import { toast } from 'sonner';
import { uploadImageToOSS, validateImageSize, validateImageType } from '@/utils/ossUpload';
import '@/styles/blog-editor.css';

interface BlogMarkdownEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  onSaveShortcut?: () => void;
  placeholder?: string;
  minHeightClassName?: string;
  showStats?: boolean;
  showSourceToggle?: boolean;
}

const getMarkdownContent = (editor: unknown): string => {
  const tiptapEditor = editor as {
    getMarkdown?: () => string;
    storage?: { markdown?: { getMarkdown?: () => string } };
  };

  if (typeof tiptapEditor.getMarkdown === 'function') {
    return tiptapEditor.getMarkdown();
  }

  return tiptapEditor.storage?.markdown?.getMarkdown?.() || '';
};

const toPlainText = (markdown: string) => markdown
  .replace(/```[\s\S]*?```/g, ' ')
  .replace(/`[^`]+`/g, ' ')
  .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
  .replace(/\[[^\]]+\]\([^)]*\)/g, '$1')
  .replace(/[#>*_~\-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export default function BlogMarkdownEditor({
  value,
  onChange,
  onSaveShortcut,
  placeholder = '输入 / 可以快速插入段落类型，按 Cmd/Ctrl + S 保存草稿...',
  minHeightClassName = 'min-h-[60vh]',
  showStats = true,
  showSourceToggle = true
}: BlogMarkdownEditorProps) {
  const [sourceOpen, setSourceOpen] = useState(false);
  const [sourceValue, setSourceValue] = useState(value);
  const lastSyncedRef = useRef(value);

  const handleImageFiles = useCallback(async (files: File[], onInsert: (url: string, fileName: string) => void) => {
    for (const file of files) {
      if (!validateImageType(file)) {
        toast.error(`${file.name}: 仅支持 JPG/PNG/GIF/WebP`);
        continue;
      }
      if (!validateImageSize(file)) {
        toast.error(`${file.name}: 文件超过 15MB`);
        continue;
      }

      const toastId = toast.loading(`上传图片中: ${file.name}`);
      try {
        const result = await uploadImageToOSS(file);
        if (!result.success || !result.url) {
          throw new Error(result.error || '上传失败');
        }
        onInsert(result.url, file.name);
        toast.success('图片上传成功', { id: toastId });
      } catch (error) {
        const message = error instanceof Error ? error.message : '上传失败';
        toast.error(`上传失败: ${message}`, { id: toastId });
      }
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder
      }),
      Markdown.configure({
        html: false,
        transformCopiedText: true,
        transformPastedText: true
      })
    ],
    content: value,
    contentType: 'markdown',
    editorProps: {
      attributes: {
        class: `prose prose-slate max-w-none px-8 py-10 md:px-14 md:py-12 ${minHeightClassName}`
      },
      handlePaste: (view, event) => {
        const files = Array.from(event.clipboardData?.files || []).filter((file) => file.type.startsWith('image/'));
        if (!files.length) {
          return false;
        }

        event.preventDefault();
        void handleImageFiles(files, (url, fileName) => {
          view.dispatch(
            view.state.tr.replaceSelectionWith(
              view.state.schema.nodes.image.create({ src: url, alt: fileName })
            ).scrollIntoView()
          );
          view.focus();
        });
        return true;
      },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files || []).filter((file) => file.type.startsWith('image/'));
        if (!files.length) {
          return false;
        }

        event.preventDefault();
        void handleImageFiles(files, (url, fileName) => {
          view.dispatch(
            view.state.tr.replaceSelectionWith(
              view.state.schema.nodes.image.create({ src: url, alt: fileName })
            ).scrollIntoView()
          );
          view.focus();
        });
        return true;
      }
    },
    onUpdate: ({ editor: currentEditor }) => {
      const markdown = getMarkdownContent(currentEditor);
      lastSyncedRef.current = markdown;
      setSourceValue(markdown);
      onChange(markdown);
    }
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const current = getMarkdownContent(editor);
    if (value !== current && value !== lastSyncedRef.current) {
      editor.commands.setContent(value, { contentType: 'markdown' });
      setSourceValue(value);
      lastSyncedRef.current = value;
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        onSaveShortcut?.();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [editor, onSaveShortcut]);

  const stats = useMemo(() => {
    const plain = toPlainText(sourceValue);
    const words = plain ? plain.split(' ').length : 0;
    return {
      words,
      minutes: Math.max(1, Math.ceil(words / 240))
    };
  }, [sourceValue]);

  if (!editor) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">编辑器加载中...</div>;
  }

  const toolbarButton = (label: string, onClick: () => void, active = false) => (
    <button
      type="button"
      onClick={onClick}
      className={`blog-editor-toolbar-btn rounded-md px-2.5 py-1.5 text-sm text-slate-700 transition-colors ${active ? 'active' : ''}`}
    >
      {label}
    </button>
  );

  return (
    <div className="blog-editor-shell overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50/70 px-3 py-2">
        {toolbarButton('H1', () => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive('heading', { level: 1 }))}
        {toolbarButton('H2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
        {toolbarButton('H3', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}
        {toolbarButton('B', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
        {toolbarButton('I', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
        {toolbarButton('U', () => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'))}
        {toolbarButton('Quote', () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'))}
        {toolbarButton('UL', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
        {toolbarButton('OL', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
        {toolbarButton('Todo', () => editor.chain().focus().toggleTaskList().run(), editor.isActive('taskList'))}
        {toolbarButton('Code', () => editor.chain().focus().toggleCodeBlock().run(), editor.isActive('codeBlock'))}
        {toolbarButton('Link', () => {
          const previous = editor.getAttributes('link').href as string | undefined;
          const next = window.prompt('输入链接地址', previous || 'https://');
          if (next === null) {
            return;
          }
          if (next.trim() === '') {
            editor.chain().focus().unsetLink().run();
            return;
          }
          editor.chain().focus().setLink({ href: next.trim() }).run();
        }, editor.isActive('link'))}
        <span className="mx-1 h-5 w-px bg-slate-300" aria-hidden="true" />
        {toolbarButton('/ 插入', () => {
          editor.chain().focus().insertContent('/').run();
        })}
        {showSourceToggle && toolbarButton(sourceOpen ? '关闭源码' : '源码', () => setSourceOpen((prev) => !prev), sourceOpen)}
      </div>

      <EditorContent editor={editor} className="bg-[var(--editor-bg)]" />

      {sourceOpen && (
        <div className="border-t border-slate-200 bg-slate-50 p-4">
          <textarea
            value={sourceValue}
            onChange={(event) => {
              const next = event.target.value;
              setSourceValue(next);
              editor.commands.setContent(next, { contentType: 'markdown' });
              onChange(next);
            }}
            className="h-56 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm text-slate-700 outline-none focus:border-[#165DFF]"
          />
        </div>
      )}

      {showStats && (
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2 text-xs text-slate-500">
          <span>支持 Markdown；可粘贴/拖拽上传图片</span>
          <span>{stats.words} 词 · 约 {stats.minutes} 分钟阅读</span>
        </div>
      )}
    </div>
  );
}
