export interface TaskContentNode {
  type: string;
  content?: TaskContentNode[];
  text?: string;
}

export interface TaskContentDoc {
  type: 'doc';
  content: TaskContentNode[];
}

export function markdownToTaskContent(markdown: string): TaskContentDoc {
  const lines = markdown.split('\n');
  const content = lines.length
    ? lines.map((line) => ({
        type: 'paragraph',
        content: line ? [{ type: 'text', text: line }] : []
      }))
    : [{ type: 'paragraph', content: [] }];

  return {
    type: 'doc',
    content
  };
}

export function isTaskContentDoc(value: unknown): value is TaskContentDoc {
  if (!value || typeof value !== 'object') return false;
  const node = value as Record<string, unknown>;
  return node.type === 'doc' && Array.isArray(node.content);
}

export function taskContentToMarkdown(doc: TaskContentDoc): string {
  const lines = doc.content.map((node) => {
    if (node?.type === 'image') {
      const attrs = (node as unknown as { attrs?: Record<string, unknown> }).attrs || {};
      const src = typeof attrs.src === 'string' ? attrs.src : '';
      if (!src) return '';
      const alt = typeof attrs.alt === 'string' ? attrs.alt : 'image';
      return `![${alt}](${src})`;
    }

    if (!node || !Array.isArray(node.content)) return '';
    return node.content
      .filter((child) => typeof child?.text === 'string')
      .map((child) => child.text as string)
      .join('');
  });

  return lines.join('\n').trim();
}
