import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/config/api';
import { toast } from 'sonner';

interface ExternalToken {
  id: number;
  description: string;
  token?: string | null;
  token_prefix?: string | null;
  is_active: boolean;
  last_used_at?: string | null;
  last_used_ip?: string | null;
  created_at: string;
  updated_at?: string;
}

export default function ExternalTokensTab() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tokens, setTokens] = useState<ExternalToken[]>([]);

  const loadTokens = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiRequest('/api/admin/external-tokens');
      if (result.success) {
        setTokens(result.data || []);
      } else {
        toast.error(result.message || '获取 Key 列表失败');
      }
    } catch {
      toast.error('获取 Key 列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  const activeCount = useMemo(() => tokens.filter((item) => item.is_active).length, [tokens]);

  const handleCreateKey = useCallback(async () => {
    const descriptionInput = window.prompt('请输入 Key 描述', 'OpenClaw 每日汇报 Key');
    if (!descriptionInput || !descriptionInput.trim()) return;
    const customKeyInput = window.prompt('可选：输入自定义 Key（留空自动生成）', '');

    setSubmitting(true);
    try {
      const result = await apiRequest('/api/admin/external-tokens', {
        method: 'POST',
        body: JSON.stringify({
          description: descriptionInput.trim(),
          key: (customKeyInput || '').trim() || undefined
        })
      });

      if (result.success) {
        toast.success('Key 创建成功');
        await loadTokens();
      } else {
        toast.error(result.message || 'Key 创建失败');
      }
    } catch {
      toast.error('Key 创建失败');
    } finally {
      setSubmitting(false);
    }
  }, [loadTokens]);

  const handleToggleActive = useCallback(async (item: ExternalToken) => {
    try {
      const result = await apiRequest(`/api/admin/external-tokens/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !item.is_active })
      });

      if (result.success) {
        toast.success(item.is_active ? '已禁用' : '已启用');
        await loadTokens();
      } else {
        toast.error(result.message || '更新失败');
      }
    } catch {
      toast.error('更新失败');
    }
  }, [loadTokens]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900">API Key列表</h3>
          <div className="flex items-center gap-2">
            <div className="text-sm text-slate-500">总计 {tokens.length} · 启用 {activeCount}</div>
            <button
              onClick={handleCreateKey}
              disabled={submitting}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[#165DFF] hover:bg-[#0E4BA4] disabled:opacity-60"
            >
              {submitting ? '创建中...' : '创建 Key'}
            </button>
            <button
              onClick={loadTokens}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {loading ? '刷新中...' : '刷新'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-slate-500">加载中...</div>
        ) : tokens.length === 0 ? (
          <div className="text-sm text-slate-600">暂无 Key。</div>
        ) : (
          <div className="space-y-3">
            {tokens.map((item) => (
              <div key={item.id} className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{item.description || '未命名 Key'}</div>
                    <div className="text-xs text-slate-500 mt-1 font-mono break-all">
                      key: {item.token || item.token_prefix || '-'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      状态：{item.is_active ? '启用' : '禁用'} · 创建：{new Date(item.created_at).toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      最近使用：{item.last_used_at ? new Date(item.last_used_at).toLocaleString() : '从未'}
                      {item.last_used_ip ? ` · IP: ${item.last_used_ip}` : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleActive(item)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0"
                  >
                    {item.is_active ? '禁用' : '启用'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
