import type { Blog } from '@/types';

export interface BlogEditorFormData {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string;
  published: boolean;
  featured: boolean;
  cover_image: string;
}

interface BlogMetaPanelProps {
  formData: BlogEditorFormData;
  onPatch: (patch: Partial<BlogEditorFormData>) => void;
  onAIGenerateExcerpt: () => void;
  onAIGenerateTags: () => void;
  onAIGenerateCategory: () => void;
  isGeneratingExcerpt: boolean;
  isGeneratingTags: boolean;
  isGeneratingCategory: boolean;
  isUploadingCover: boolean;
}

const aiButtonClass = 'text-xs text-[#165DFF] hover:text-[#165DFF]/80 disabled:opacity-50 disabled:cursor-not-allowed';

export const blogFormDataToPayload = (formData: BlogEditorFormData): Partial<Blog> => ({
  title: formData.title.trim(),
  content: formData.content,
  excerpt: formData.excerpt.trim(),
  category: formData.category.trim(),
  tags: formData.tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean),
  published: formData.published,
  featured: formData.featured,
  cover_image: formData.cover_image.trim()
});

export default function BlogMetaPanel({
  formData,
  onPatch,
  onAIGenerateExcerpt,
  onAIGenerateTags,
  onAIGenerateCategory,
  isGeneratingExcerpt,
  isGeneratingTags,
  isGeneratingCategory,
  isUploadingCover
}: BlogMetaPanelProps) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">分类</label>
          <div className="mb-2 flex items-center justify-end">
            <button
              type="button"
              onClick={onAIGenerateCategory}
              disabled={isGeneratingCategory || !formData.content.trim()}
              className={aiButtonClass}
            >
              {isGeneratingCategory ? 'AI 生成中...' : 'AI 生成分类'}
            </button>
          </div>
          <input
            value={formData.category}
            onChange={(event) => onPatch({ category: event.target.value })}
            placeholder="例如：AI、前端、产品"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#165DFF]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">摘要</label>
          <div className="mb-2 flex items-center justify-end">
            <button
              type="button"
              onClick={onAIGenerateExcerpt}
              disabled={isGeneratingExcerpt || !formData.content.trim()}
              className={aiButtonClass}
            >
              {isGeneratingExcerpt ? 'AI 生成中...' : 'AI 生成摘要'}
            </button>
          </div>
          <textarea
            rows={4}
            value={formData.excerpt}
            onChange={(event) => onPatch({ excerpt: event.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#165DFF]"
            placeholder="一句话说明文章核心观点"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">标签（逗号分隔）</label>
          <div className="mb-2 flex items-center justify-end">
            <button
              type="button"
              onClick={onAIGenerateTags}
              disabled={isGeneratingTags || !formData.content.trim()}
              className={aiButtonClass}
            >
              {isGeneratingTags ? 'AI 生成中...' : 'AI 生成标签'}
            </button>
          </div>
          <input
            value={formData.tags}
            onChange={(event) => onPatch({ tags: event.target.value })}
            placeholder="React, TypeScript, 经验总结"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#165DFF]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">封面图 URL</label>
          <input
            value={formData.cover_image}
            disabled={isUploadingCover}
            onChange={(event) => onPatch({ cover_image: event.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#165DFF] disabled:bg-slate-100"
            placeholder={isUploadingCover ? '图片上传中...' : '可直接粘贴截图到正文自动上传'}
          />
          {formData.cover_image && (
            <img
              src={formData.cover_image}
              alt="封面预览"
              className="mt-3 h-36 w-full rounded-lg border border-slate-200 object-cover"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          )}
        </div>

        <div className="space-y-2 text-sm text-slate-700">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.published}
              onChange={(event) => onPatch({ published: event.target.checked })}
              className="rounded border-slate-300 text-[#165DFF]"
            />
            发布状态
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(event) => onPatch({ featured: event.target.checked })}
              className="rounded border-slate-300 text-[#165DFF]"
            />
            设为精选
          </label>
        </div>
      </div>
    </aside>
  );
}
