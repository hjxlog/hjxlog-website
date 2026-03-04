import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner';
import BlogMarkdownEditor from '@/components/editor/BlogMarkdownEditor';
import { apiRequest } from '@/config/api';
import type { Work } from '@/types';

interface WorkEditorFormData {
  title: string;
  description: string;
  content: string;
  category: string;
  status: string;
  tags: string;
  technologies: string;
  project_url: string;
  github_url: string;
  cover_image: string;
  screenshots: string;
  features: string;
  challenges: string;
  featured: boolean;
}

const createEmptyWorkForm = (): WorkEditorFormData => ({
  title: '',
  description: '',
  content: '',
  category: '',
  status: 'active',
  tags: '',
  technologies: '',
  project_url: '',
  github_url: '',
  cover_image: '',
  screenshots: '',
  features: '',
  challenges: '',
  featured: false
});

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const parseResponseData = <T,>(response: unknown): T => {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as { data: T }).data;
  }
  return response as T;
};

const splitByComma = (value: string) => value
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const mapWorkToFormData = (work: Partial<Work>): WorkEditorFormData => ({
  title: work.title || '',
  description: work.description || '',
  content: work.content || '',
  category: work.category || '',
  status: work.status || 'active',
  tags: Array.isArray(work.tags) ? work.tags.join(', ') : '',
  technologies: Array.isArray(work.technologies) ? work.technologies.join(', ') : '',
  project_url: work.project_url || '',
  github_url: work.github_url || '',
  cover_image: work.cover_image || '',
  screenshots: Array.isArray(work.screenshots) ? work.screenshots.join(', ') : '',
  features: Array.isArray(work.features) ? work.features.join(', ') : '',
  challenges: Array.isArray(work.challenges) ? work.challenges.join(', ') : '',
  featured: Boolean(work.featured)
});

const buildWorkPayload = (form: WorkEditorFormData): Partial<Work> => ({
  title: form.title.trim(),
  description: form.description,
  content: form.content,
  category: form.category.trim(),
  status: form.status,
  tags: splitByComma(form.tags),
  technologies: splitByComma(form.technologies),
  project_url: form.project_url.trim(),
  github_url: form.github_url.trim(),
  cover_image: form.cover_image.trim(),
  screenshots: splitByComma(form.screenshots),
  features: splitByComma(form.features),
  challenges: splitByComma(form.challenges),
  featured: form.featured
});

export default function WorkEditor() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const fromDashboard = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('from') === 'dashboard';
  }, [location.search]);

  const isPrivacyModeEnabled = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const raw = localStorage.getItem('dashboard.privacyMode');
    if (raw === '0' || raw === 'false') return false;
    if (raw === '1' || raw === 'true') return true;
    return fromDashboard;
  }, [fromDashboard]);

  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isDirty, setIsDirty] = useState(false);
  const [formData, setFormData] = useState<WorkEditorFormData>(createEmptyWorkForm);

  const backTarget = fromDashboard ? '/dashboard' : '/dashboard';

  const patchFormData = useCallback((patch: Partial<WorkEditorFormData>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
    setIsDirty(true);
    setSaveStatus('idle');
  }, []);

  const loadWork = useCallback(async () => {
    if (!isEditing || !id) {
      setFormData(createEmptyWorkForm());
      setIsDirty(false);
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest(`/api/works/${id}`);
      const work = parseResponseData<Partial<Work>>(response);
      setFormData(mapWorkToFormData(work));
      setIsDirty(false);
    } catch (error) {
      console.error('加载作品失败:', error);
      toast.error('加载作品失败');
      navigate(backTarget);
    } finally {
      setLoading(false);
    }
  }, [backTarget, id, isEditing, navigate]);

  useEffect(() => {
    void loadWork();
  }, [loadWork]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) {
        return;
      }
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const saveWork = useCallback(async () => {
    if (!formData.title.trim()) {
      toast.error('请输入作品标题');
      return false;
    }

    if (!formData.description.trim()) {
      toast.error('请输入简短描述');
      return false;
    }

    if (!formData.category.trim()) {
      toast.error('请输入分类');
      return false;
    }

    setSaveStatus('saving');

    try {
      const payload = buildWorkPayload(formData);

      if (isEditing && id) {
        await apiRequest(`/api/works/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiRequest('/api/works', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      setSaveStatus('saved');
      setIsDirty(false);
      toast.success('作品保存成功');
      return true;
    } catch (error) {
      console.error('保存作品失败:', error);
      setSaveStatus('error');
      toast.error('保存作品失败');
      return false;
    }
  }, [formData, id, isEditing]);

  const handleBack = useCallback(() => {
    if (isDirty && !window.confirm('有未保存更改，确定离开吗？')) {
      return;
    }
    navigate(backTarget);
  }, [backTarget, isDirty, navigate]);

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center bg-slate-50 ${isPrivacyModeEnabled ? 'dashboard-privacy dashboard-privacy--dimmed' : ''}`}>
        <LoadingSpinner size="lg" text="正在加载作品内容..." />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 ${isPrivacyModeEnabled ? 'dashboard-privacy dashboard-privacy--dimmed' : ''}`}>
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1700px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <p className="text-sm font-medium text-slate-700">{isEditing ? '编辑作品' : '新建作品'}</p>
              <p className="text-xs text-slate-500">
                {saveStatus === 'saving' ? '保存中...' : saveStatus === 'saved' ? '已保存' : saveStatus === 'error' ? '保存失败' : isDirty ? '未保存更改' : '内容最新'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void saveWork()}
            disabled={saveStatus === 'saving'}
            className="rounded-lg bg-[#165DFF] px-4 py-2 text-sm font-medium text-white hover:bg-[#165DFF]/90 disabled:opacity-60"
          >
            保存作品
          </button>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1700px] grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <section className="space-y-4">
          <input
            value={formData.title}
            onChange={(event) => patchFormData({ title: event.target.value })}
            placeholder="输入作品标题..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-6 py-5 text-3xl font-bold text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#165DFF]"
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-2 text-sm font-medium text-slate-700">简短描述</p>
            <BlogMarkdownEditor
              value={formData.description}
              onChange={(description) => patchFormData({ description })}
              placeholder="一句话说明项目价值、场景与结果..."
              minHeightClassName="min-h-[14rem]"
              showStats={false}
              showSourceToggle={false}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-2 text-sm font-medium text-slate-700">完整内容</p>
            <BlogMarkdownEditor
              value={formData.content}
              onChange={(content) => patchFormData({ content })}
              onSaveShortcut={() => {
                void saveWork();
              }}
              placeholder="详细记录方案、架构、实现细节、复盘..."
              minHeightClassName="min-h-[28rem]"
            />
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">分类</label>
                <input
                  value={formData.category}
                  onChange={(event) => patchFormData({ category: event.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#165DFF]"
                  placeholder="Web开发"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">状态</label>
                <select
                  value={formData.status}
                  onChange={(event) => patchFormData({ status: event.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#165DFF]"
                >
                  <option value="active">进行中</option>
                  <option value="completed">已完成</option>
                  <option value="archived">已归档</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">标签</label>
              <input
                value={formData.tags}
                onChange={(event) => patchFormData({ tags: event.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#165DFF]"
                placeholder="React, TypeScript"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">技术栈</label>
              <input
                value={formData.technologies}
                onChange={(event) => patchFormData({ technologies: event.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#165DFF]"
                placeholder="React, Node.js, PostgreSQL"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">项目链接</label>
              <input
                value={formData.project_url}
                onChange={(event) => patchFormData({ project_url: event.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#165DFF]"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">GitHub 链接</label>
              <input
                value={formData.github_url}
                onChange={(event) => patchFormData({ github_url: event.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#165DFF]"
                placeholder="https://github.com/xxx/yyy"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">封面图 URL</label>
              <input
                value={formData.cover_image}
                onChange={(event) => patchFormData({ cover_image: event.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#165DFF]"
                placeholder="https://.../cover.png"
              />
              {formData.cover_image && (
                <img
                  src={formData.cover_image}
                  alt="封面预览"
                  className="mt-2 h-32 w-full rounded-lg border border-slate-200 object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">截图列表</label>
              <input
                value={formData.screenshots}
                onChange={(event) => patchFormData({ screenshots: event.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#165DFF]"
                placeholder="url1, url2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">核心功能</label>
              <input
                value={formData.features}
                onChange={(event) => patchFormData({ features: event.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#165DFF]"
                placeholder="功能A, 功能B"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">技术挑战</label>
              <input
                value={formData.challenges}
                onChange={(event) => patchFormData({ challenges: event.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#165DFF]"
                placeholder="挑战A, 挑战B"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(event) => patchFormData({ featured: event.target.checked })}
                className="rounded border-slate-300 text-[#165DFF]"
              />
              设为精选作品
            </label>
          </div>
        </aside>
      </main>
    </div>
  );
}
