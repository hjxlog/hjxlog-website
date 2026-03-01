import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { EditorView } from '@tiptap/pm/view';
import { toast } from 'sonner';
import { TaskContentDoc, taskContentToMarkdown } from '@/utils/taskContent';
import { uploadImageToOSS, validateImageSize, validateImageType } from '@/utils/ossUpload';

interface TaskContentEditorProps {
  value: TaskContentDoc;
  onChange: (doc: TaskContentDoc, markdown: string) => void;
}

interface BlockMeta {
  index: number;
  startPos: number;
  top: number;
}

export default function TaskContentEditor({ value, onChange }: TaskContentEditorProps) {
  const editorWrapRef = useRef<HTMLDivElement | null>(null);
  const [currentBlock, setCurrentBlock] = useState<{ index: number; top: number } | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const getBlockMeta = (): BlockMeta[] => {
    if (!editor) return [];
    const metas: BlockMeta[] = [];
    const { doc } = editor.state;
    doc.forEach((node, offset, index) => {
      const startPos = offset + 1;
      const coords = editor.view.coordsAtPos(startPos);
      metas.push({
        index,
        startPos,
        top: coords.top
      });
    });
    return metas;
  };

  const computeDropIndex = (clientY: number, metas: BlockMeta[]) => {
    if (!metas.length) return 0;
    let result = metas.length;
    for (let i = 0; i < metas.length; i++) {
      const current = metas[i];
      const next = metas[i + 1];
      const middle = next ? (current.top + next.top) / 2 : current.top + 24;
      if (clientY < middle) {
        result = i;
        break;
      }
    }
    return result;
  };

  const insertImageAtSelection = (view: EditorView, url: string, alt: string) => {
    const imageNodeType = view.state.schema.nodes.image;
    if (!imageNodeType) return;

    const imageNode = imageNodeType.create({
      src: url,
      alt
    });
    const tr = view.state.tr.replaceSelectionWith(imageNode).scrollIntoView();
    view.dispatch(tr);
    view.focus();
  };

  const handleImageFiles = async (files: File[], view: EditorView) => {
    for (const file of files) {
      if (!validateImageType(file)) {
        toast.error(`${file.name}: 不支持的文件类型`);
        continue;
      }
      if (!validateImageSize(file)) {
        toast.error(`${file.name}: 文件大小超过15MB限制`);
        continue;
      }

      const toastId = toast.loading(`上传中: ${file.name}`);
      try {
        const uploadResult = await uploadImageToOSS(file);
        if (!uploadResult.success || !uploadResult.url) {
          throw new Error(uploadResult.error || '上传失败');
        }
        insertImageAtSelection(view, uploadResult.url, file.name || 'image');
        toast.success(`${file.name} 上传成功`, { id: toastId });
      } catch (error) {
        console.error('Task editor image upload failed:', error);
        const message = error instanceof Error ? error.message : '上传失败';
        toast.error(`${file.name} 上传失败: ${message}`, { id: toastId });
      }
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: '直接开始记录任务过程...'
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image
    ],
    content: value,
    editorProps: {
      handlePaste: (view, event) => {
        const files = Array.from(event.clipboardData?.files || []).filter((file) =>
          file.type.startsWith('image/')
        );
        if (!files.length) return false;
        event.preventDefault();
        void handleImageFiles(files, view);
        return true;
      },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files || []).filter((file) =>
          file.type.startsWith('image/')
        );
        if (!files.length) return false;
        event.preventDefault();
        void handleImageFiles(files, view);
        return true;
      },
      attributes: {
        class:
          'task-editor-content min-h-[52vh] lg:min-h-[58vh] prose prose-sm max-w-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none'
      }
    },
    onUpdate: ({ editor: currentEditor }) => {
      const json = currentEditor.getJSON() as TaskContentDoc;
      onChange(json, taskContentToMarkdown(json));
    }
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getJSON();
    if (JSON.stringify(current) !== JSON.stringify(value)) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;
    const updateCurrentBlock = () => {
      const { from } = editor.state.selection;
      let matched: BlockMeta | null = null;
      editor.state.doc.forEach((node, offset, index) => {
        const startPos = offset + 1;
        const endPos = startPos + node.nodeSize - 1;
        if (from >= startPos && from <= endPos) {
          const coords = editor.view.coordsAtPos(startPos);
          matched = {
            index,
            startPos,
            top: coords.top
          };
        }
      });
      if (!matched || !editorWrapRef.current) {
        setCurrentBlock(null);
        return;
      }
      const wrapTop = editorWrapRef.current.getBoundingClientRect().top;
      setCurrentBlock({
        index: matched.index,
        top: matched.top - wrapTop
      });
    };

    updateCurrentBlock();
    editor.on('selectionUpdate', updateCurrentBlock);
    editor.on('update', updateCurrentBlock);
    window.addEventListener('resize', updateCurrentBlock);
    window.addEventListener('scroll', updateCurrentBlock, true);

    return () => {
      editor.off('selectionUpdate', updateCurrentBlock);
      editor.off('update', updateCurrentBlock);
      window.removeEventListener('resize', updateCurrentBlock);
      window.removeEventListener('scroll', updateCurrentBlock, true);
    };
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="mb-2 flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-600">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className="rounded px-2 py-1 hover:bg-white">粗体</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className="rounded px-2 py-1 hover:bg-white">斜体</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className="rounded px-2 py-1 hover:bg-white">H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className="rounded px-2 py-1 hover:bg-white">列表</button>
        <button type="button" onClick={() => editor.chain().focus().toggleTaskList().run()} className="rounded px-2 py-1 hover:bg-white">待办</button>
        <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className="rounded px-2 py-1 hover:bg-white">代码</button>
      </div>
      <div
        ref={editorWrapRef}
        className="relative flex-1 overflow-y-auto rounded-xl"
        onDragOver={(event) => {
          if (draggingIndex === null || !editor) return;
          event.preventDefault();
          const metas = getBlockMeta();
          const nextDropIndex = computeDropIndex(event.clientY, metas);
          setDropIndex(nextDropIndex);
        }}
        onDrop={(event) => {
          if (draggingIndex === null || !editor) return;
          if (event.dataTransfer?.files?.length) return;
          event.preventDefault();
          const metas = getBlockMeta();
          const rawDropIndex = computeDropIndex(event.clientY, metas);
          const documentJson = editor.getJSON() as TaskContentDoc;
          if (!Array.isArray(documentJson.content) || !documentJson.content[draggingIndex]) {
            setDraggingIndex(null);
            setDropIndex(null);
            return;
          }
          const next = [...documentJson.content];
          const [moved] = next.splice(draggingIndex, 1);
          const adjustedIndex = rawDropIndex > draggingIndex ? rawDropIndex - 1 : rawDropIndex;
          next.splice(Math.max(0, Math.min(adjustedIndex, next.length)), 0, moved);
          editor.commands.setContent({
            type: 'doc',
            content: next
          });
          setDraggingIndex(null);
          setDropIndex(null);
          toast.success('区块顺序已更新');
        }}
      >
        {currentBlock && (
          <button
            type="button"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('text/plain', `block-${currentBlock.index}`);
              setDraggingIndex(currentBlock.index);
              setDropIndex(currentBlock.index);
            }}
            onDragEnd={() => {
              setDraggingIndex(null);
              setDropIndex(null);
            }}
            onMouseDown={(event) => {
              event.preventDefault();
              editor.chain().focus().run();
            }}
            className="absolute z-20 -left-6 h-5 w-5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 cursor-grab"
            style={{ top: `${Math.max(0, currentBlock.top + 4)}px` }}
            title="拖拽调整区块顺序"
          >
            ⋮⋮
          </button>
        )}

        {draggingIndex !== null && dropIndex !== null && (
          <div
            className="pointer-events-none absolute left-1 right-1 h-[2px] bg-[#165DFF]"
            style={{
              top: `${Math.max(
                8,
                (() => {
                  const metas = getBlockMeta();
                  if (!metas.length) return 8;
                  if (dropIndex >= metas.length) return metas[metas.length - 1].top - (editorWrapRef.current?.getBoundingClientRect().top || 0) + 30;
                  return metas[dropIndex].top - (editorWrapRef.current?.getBoundingClientRect().top || 0);
                })()
              )}px`
            }}
          />
        )}

        <EditorContent editor={editor} className="h-full rounded-xl" />
      </div>
    </div>
  );
}
