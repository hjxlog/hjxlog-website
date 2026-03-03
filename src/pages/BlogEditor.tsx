import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/LoadingSpinner';
import BlogMarkdownEditor from '@/components/editor/BlogMarkdownEditor';
import BlogMetaPanel, { BlogEditorFormData, blogFormDataToPayload } from '@/components/editor/BlogMetaPanel';
import { apiRequest } from '@/config/api';

const createEmptyFormData = (): BlogEditorFormData => ({
  title: '',
  content: '',
  excerpt: '',
  category: '',
  tags: '',
  published: false,
  featured: false,
  cover_image: ''
});

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const parseResponseData = <T,>(response: unknown): T => {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as { data: T }).data;
  }
  return response as T;
};

export default function BlogEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isEditing = Boolean(id);

  const fromDashboard = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('from') === 'dashboard';
  }, [location.search]);

  const [formData, setFormData] = useState<BlogEditorFormData>(createEmptyFormData);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isDirty, setIsDirty] = useState(false);
  const [isGeneratingExcerpt, setIsGeneratingExcerpt] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isGeneratingCategory, setIsGeneratingCategory] = useState(false);

  const backTarget = fromDashboard ? '/dashboard' : '/admin/blogs';

  const patchFormData = useCallback((patch: Partial<BlogEditorFormData>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
    setIsDirty(true);
    setSaveStatus('idle');
  }, []);

  const loadBlog = useCallback(async () => {
    if (!isEditing || !id) {
      setFormData(createEmptyFormData());
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest(`/api/blogs/${id}`);
      const blog = parseResponseData<{
        title?: string;
        content?: string;
        excerpt?: string;
        category?: string;
        tags?: string[];
        published?: boolean;
        featured?: boolean;
        cover_image?: string;
      }>(response);

      setFormData({
        title: blog.title || '',
        content: blog.content || '',
        excerpt: blog.excerpt || '',
        category: blog.category || '',
        tags: (blog.tags || []).join(', '),
        published: Boolean(blog.published),
        featured: Boolean(blog.featured),
        cover_image: blog.cover_image || ''
      });
      setIsDirty(false);
    } catch (error) {
      console.error('加载博客失败:', error);
      toast.error('加载博客失败');
      navigate(backTarget);
    } finally {
      setLoading(false);
    }
  }, [backTarget, id, isEditing, navigate]);

  useEffect(() => {
    void loadBlog();
  }, [loadBlog]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) {
        return;
      }
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [isDirty]);

  const runAIGenerator = useCallback(async (endpoint: '/api/ai/generate-summary' | '/api/ai/generate-tags' | '/api/ai/generate-category') => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: formData.content })
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || data.message || '生成失败');
    }

    return data.data;
  }, [formData.content]);

  const handleAIGenerateExcerpt = useCallback(async () => {
    if (!formData.content.trim()) {
      toast.error('请先输入正文内容');
      return;
    }
    setIsGeneratingExcerpt(true);
    try {
      const data = await runAIGenerator('/api/ai/generate-summary');
      patchFormData({ excerpt: data.summary || '' });
      toast.success('摘要生成成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '摘要生成失败';
      toast.error(message);
    } finally {
      setIsGeneratingExcerpt(false);
    }
  }, [formData.content, patchFormData, runAIGenerator]);

  const handleAIGenerateTags = useCallback(async () => {
    if (!formData.content.trim()) {
      toast.error('请先输入正文内容');
      return;
    }
    setIsGeneratingTags(true);
    try {
      const data = await runAIGenerator('/api/ai/generate-tags');
      const tags = Array.isArray(data.tags) ? data.tags.join(', ') : '';
      patchFormData({ tags });
      toast.success('标签生成成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '标签生成失败';
      toast.error(message);
    } finally {
      setIsGeneratingTags(false);
    }
  }, [formData.content, patchFormData, runAIGenerator]);

  const handleAIGenerateCategory = useCallback(async () => {
    if (!formData.content.trim()) {
      toast.error('请先输入正文内容');
      return;
    }
    setIsGeneratingCategory(true);
    try {
      const data = await runAIGenerator('/api/ai/generate-category');
      patchFormData({ category: data.category || '' });
      toast.success('分类生成成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '分类生成失败';
      toast.error(message);
    } finally {
      setIsGeneratingCategory(false);
    }
  }, [formData.content, patchFormData, runAIGenerator]);

  const saveBlog = useCallback(async (publishNow?: boolean) => {
    if (!formData.title.trim()) {
      toast.error('请输入标题');
      return false;
    }

    if (!formData.content.trim()) {
      toast.error('请输入正文内容');
      return false;
    }

    setSaveStatus('saving');

    const payload = blogFormDataToPayload({
      ...formData,
      published: publishNow === undefined ? formData.published : publishNow,
      excerpt: formData.excerpt.trim() || formData.content.slice(0, 180)
    });

    try {
      if (isEditing && id) {
        await apiRequest(`/api/blogs/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiRequest('/api/blogs', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      setFormData((prev) => ({ ...prev, published: Boolean(payload.published) }));
      setSaveStatus('saved');
      setIsDirty(false);
      toast.success(publishNow ? '文章已发布' : '已保存');
      return true;
    } catch (error) {
      console.error('保存博客失败:', error);
      setSaveStatus('error');
      toast.error('保存失败，请稍后重试');
      return false;
    }
  }, [formData, id, isEditing]);

  const handleBack = useCallback(() => {
    if (isDirty && !window.confirm('有未保存更改，确定离开吗？')) {
      return;
    }
    navigate(backTarget);
  }, [backTarget, isDirty, navigate]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) {
        return;
      }
      event.preventDefault();
      handleBack();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [handleBack]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" text="正在加载博客内容..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <p className="text-sm font-medium text-slate-700">{isEditing ? '编辑博客' : '新建博客'}</p>
              <p className="text-xs text-slate-500">
                {saveStatus === 'saving' ? '保存中...' : saveStatus === 'saved' ? '已保存' : saveStatus === 'error' ? '保存失败' : isDirty ? '未保存更改' : '内容最新'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void saveBlog()}
              disabled={saveStatus === 'saving'}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            >
              保存
            </button>
            <button
              type="button"
              onClick={() => void saveBlog(true)}
              disabled={saveStatus === 'saving'}
              className="rounded-lg bg-[#165DFF] px-3 py-2 text-sm font-medium text-white hover:bg-[#165DFF]/90 disabled:opacity-60"
            >
              发布
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        <section className="space-y-4">
          <input
            value={formData.title}
            onChange={(event) => patchFormData({ title: event.target.value })}
            placeholder="输入文章标题..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-6 py-5 text-3xl font-bold text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#165DFF]"
          />

          <BlogMarkdownEditor
            value={formData.content}
            onChange={(content) => patchFormData({ content })}
            onSaveShortcut={() => {
              void saveBlog();
            }}
          />
        </section>

        <BlogMetaPanel
          formData={formData}
          onPatch={patchFormData}
          onAIGenerateExcerpt={() => void handleAIGenerateExcerpt()}
          onAIGenerateTags={() => void handleAIGenerateTags()}
          onAIGenerateCategory={() => void handleAIGenerateCategory()}
          isGeneratingExcerpt={isGeneratingExcerpt}
          isGeneratingTags={isGeneratingTags}
          isGeneratingCategory={isGeneratingCategory}
          isUploadingCover={false}
        />
      </main>
    </div>
  );
}
