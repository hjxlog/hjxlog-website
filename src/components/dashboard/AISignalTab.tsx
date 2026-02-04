import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/config/api';
import { toast } from 'sonner';

interface DigestItem {
  itemId: number;
  title: string;
  url: string;
  summary: string;
  importance: string;
  question: string;
  types: string[];
  score: number;
  source: string;
  publishedAt?: string;
}

interface DailyDigest {
  id: number;
  digest_date: string;
  status: 'ready' | 'empty' | 'error';
  summary_text?: string;
  items: DigestItem[];
  empty_reason?: string;
}

export default function AISignalTab() {
  const [loading, setLoading] = useState(true);
  const [digest, setDigest] = useState<DailyDigest | null>(null);
  const [running, setRunning] = useState(false);
  const [opinions, setOpinions] = useState<Record<number, string>>({});
  const [replies, setReplies] = useState<Record<number, string>>({});

  const loadDigest = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiRequest('/api/ai-signal/digest/latest');
      if (result.success) {
        setDigest(result.data || null);
      } else {
        toast.error(result.message || '获取简报失败');
      }
    } catch (error) {
      toast.error('获取简报失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDigest();
  }, [loadDigest]);

  const handleRunNow = useCallback(async () => {
    setRunning(true);
    try {
      const result = await apiRequest('/api/ai-signal/run', { method: 'POST' });
      if (result.success) {
        toast.success('已触发生成');
        await loadDigest();
      } else {
        toast.error(result.message || '触发失败');
      }
    } catch (error) {
      toast.error('触发失败');
    } finally {
      setRunning(false);
    }
  }, [loadDigest]);

  const handleSubmitOpinion = useCallback(async (itemId: number, digestId?: number) => {
    const content = opinions[itemId]?.trim();
    if (!content) {
      toast.error('请输入你的观点');
      return;
    }
    try {
      const result = await apiRequest('/api/ai-signal/opinion', {
        method: 'POST',
        body: JSON.stringify({ itemId, digestId, opinionText: content })
      });
      if (result.success) {
        toast.success('观点已记录');
        setReplies((prev) => ({ ...prev, [itemId]: result.data.assistant_reply }));
      } else {
        toast.error(result.message || '提交失败');
      }
    } catch (error) {
      toast.error('提交失败');
    }
  }, [opinions]);

  const digestItems = useMemo(() => digest?.items || [], [digest]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <p className="text-slate-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">AI 情报雷达</h2>
          <p className="text-sm text-slate-500">每日 8 点自动生成，最多 3 条精选信号。</p>
        </div>
        <button
          onClick={handleRunNow}
          disabled={running}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#165DFF] hover:bg-[#0E4BA4] disabled:opacity-60"
        >
          {running ? '生成中...' : '立即生成'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        {digest ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500">简报日期</div>
                <div className="text-base font-medium text-slate-900">{digest.digest_date}</div>
              </div>
              <div className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                {digest.status === 'ready' ? '已生成' : digest.status === 'empty' ? '无有效信号' : '异常'}
              </div>
            </div>

            {digest.status === 'empty' && (
              <div className="text-slate-600">{digest.summary_text || '今天没有值得花时间的内容。'}</div>
            )}

            {digest.status === 'ready' && (
              <div className="space-y-6">
                {digest.summary_text && (
                  <div className="text-slate-600">{digest.summary_text}</div>
                )}
                {digestItems.map((item) => (
                  <div key={item.itemId} className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs text-slate-500">{item.source}</div>
                        <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                        重要性：{item.importance}
                      </span>
                    </div>
                    {item.summary && (
                      <p className="text-sm text-slate-700">{item.summary}</p>
                    )}
                    <div className="text-sm text-slate-800 font-medium">思考问题：{item.question}</div>
                    <div className="text-xs text-slate-500">
                      标签：{item.types?.join(' / ') || '未标注'} | 分数：{item.score?.toFixed(2)}
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        查看原文
                      </a>
                    </div>
                    <div className="space-y-2">
                      <textarea
                        className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        rows={3}
                        placeholder="写下你的观点（自然语言即可）"
                        value={opinions[item.itemId] || ''}
                        onChange={(event) =>
                          setOpinions((prev) => ({ ...prev, [item.itemId]: event.target.value }))
                        }
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleSubmitOpinion(item.itemId, digest.id)}
                          className="px-3 py-2 text-sm font-medium rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          记录观点
                        </button>
                      </div>
                      {replies[item.itemId] && (
                        <div className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3">
                          {replies[item.itemId]}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-slate-600">暂无简报记录。</div>
        )}
      </div>
    </div>
  );
}
