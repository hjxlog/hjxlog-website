import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/config/api';
import { toast } from 'sonner';

interface DigestItem {
  itemId: number;
  title: string;
  url: string;
  summary: string | Record<string, string>;
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

const EMPTY_REASON_LABELS: Record<string, string> = {
  no_active_sources: '当前没有可用数据源，请先初始化或启用资讯源。',
  no_recent_items: '最近时间窗口内未抓到可用资讯，请稍后重试。',
  no_matched_signal_types: '采集到资讯但未命中筛选关键词，可调整来源或规则。',
  no_high_value_items: '今天没有值得花时间的内容。'
};

interface CollectedItem {
  id: number;
  title: string;
  url: string;
  summary?: string | Record<string, string>;
  published_at?: string;
  source_name: string;
}

function SummaryBlock({
  summary,
  variant = 'full'
}: {
  summary: { conclusion?: string; points?: string; impact?: string } | null;
  variant?: 'full' | 'compact';
}) {
  if (!summary) return null;
  const hasStructured = summary.points || summary.impact;
  if (!hasStructured) {
    return (
      <p className="text-sm text-slate-700 whitespace-pre-wrap">
        {summary.conclusion}
      </p>
    );
  }

  return (
    <div className={`space-y-2 ${variant === 'compact' ? 'text-xs' : 'text-sm'}`}>
      {summary.conclusion && (
        <div className="flex items-start gap-2 mt-2">
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] self-start shrink-0">
            结论
          </span>
          <p className="text-slate-700 leading-relaxed">{summary.conclusion}</p>
        </div>
      )}
      {summary.points && (
        <div className="flex items-start gap-2">
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] self-start shrink-0">
            要点
          </span>
          <p className="text-slate-700 leading-relaxed">{summary.points}</p>
        </div>
      )}
      {summary.impact && (
        <div className="flex items-start gap-2">
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] self-start shrink-0">
            影响
          </span>
          <p className="text-slate-700 leading-relaxed">{summary.impact}</p>
        </div>
      )}
    </div>
  );
}

export default function AISignalTab() {
  const [loading, setLoading] = useState(true);
  const [digest, setDigest] = useState<DailyDigest | null>(null);
  const [running, setRunning] = useState(false);
  const [opinions, setOpinions] = useState<Record<number, string>>({});
  const [replies, setReplies] = useState<Record<number, string>>({});
  const [collected, setCollected] = useState<CollectedItem[]>([]);
  const [listLimit, setListLimit] = useState(50);
  const [listLoading, setListLoading] = useState(false);

  const loadDigest = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiRequest('/api/ai-signal/digest/latest');
      if (result.success) {
        setDigest(result.data || null);
      } else {
        toast.error(result.message || '获取简报失败');
      }
    } catch {
      toast.error('获取简报失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCollected = useCallback(async () => {
    setListLoading(true);
    try {
      const since = new Date();
      since.setDate(since.getDate() - 3);
      const sinceStr = since.toISOString().slice(0, 10);
      const result = await apiRequest(`/api/ai-signal/items?since=${sinceStr}&limit=${listLimit}`);
      if (result.success) {
        setCollected(result.data || []);
      } else {
        toast.error(result.message || '获取采集列表失败');
      }
    } catch {
      toast.error('获取采集列表失败');
    } finally {
      setListLoading(false);
    }
  }, [listLimit]);

  useEffect(() => {
    loadDigest();
    loadCollected();
  }, [loadDigest]);

  useEffect(() => {
    loadCollected();
  }, [listLimit, loadCollected]);

  const handleRunNow = useCallback(async () => {
    setRunning(true);
    try {
      const result = await apiRequest('/api/ai-signal/run', { method: 'POST' });
      if (result.success) {
        const reason = result?.data?.emptyReason || result?.data?.empty_reason;
        if (result?.data?.status === 'empty') {
          toast.warning(EMPTY_REASON_LABELS[reason] || '本次生成暂无有效内容');
        } else {
          toast.success('已触发生成');
        }
        await loadDigest();
        await loadCollected();
      } else {
        toast.error(result.message || '触发失败');
      }
    } catch {
      toast.error('触发失败');
    } finally {
      setRunning(false);
    }
  }, [loadCollected, loadDigest]);

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
    } catch {
      toast.error('提交失败');
    }
  }, [opinions]);

  const digestItems = useMemo(() => digest?.items || [], [digest]);
  const parseSummary = useCallback((summary?: string | Record<string, string>) => {
    if (!summary) return null;
    if (typeof summary === 'string') {
      let raw = summary.trim();
      if (!raw) return null;
      // Try JSON parse if string looks like an object
      if (raw.startsWith('{') && raw.endsWith('}')) {
        try {
          const parsed = JSON.parse(raw);
          return {
            conclusion: parsed['结论'] || parsed['conclusion'] || '',
            points: parsed['要点'] || parsed['points'] || '',
            impact: parsed['影响'] || parsed['impact'] || ''
          };
        } catch {
          // fall through
        }
      }

      // Parse labeled text blocks if present
      const lines = raw.split(/\n+/).map((line) => line.trim()).filter(Boolean);
      const getLine = (label: string) => {
        const match = lines.find((line) => line.startsWith(label));
        if (!match) return '';
        return match.replace(label, '').replace(/^[:：]\s*/, '').trim();
      };
      const conclusion = getLine('结论');
      const points = getLine('要点');
      const impact = getLine('影响');
      if (conclusion || points || impact) {
        return { conclusion, points, impact };
      }

      return { conclusion: raw };
    }
    return {
      conclusion: summary['结论'] || '',
      points: summary['要点'] || '',
      impact: summary['影响'] || ''
    };
  }, []);

  const emptyReasonText = useMemo(() => {
    if (!digest?.empty_reason) return '';
    return EMPTY_REASON_LABELS[digest.empty_reason] || '';
  }, [digest?.empty_reason]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <p className="text-slate-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">AI 情报雷达</h2>
          <p className="text-sm text-slate-500">每日 8 点自动生成，最多 5 条精选信号。</p>
        </div>
        <button
          onClick={handleRunNow}
          disabled={running}
          className="whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#165DFF] hover:bg-[#0E4BA4] disabled:opacity-60"
        >
          {running ? '生成中...' : '立即生成'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">今日采集列表</h3>
            <p className="text-sm text-slate-500">展示最近 3 天采集到的原始条目。</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={listLimit}
              onChange={(event) => setListLimit(Number(event.target.value))}
              className="text-sm border border-slate-200 rounded-lg px-2 py-1"
            >
              <option value={30}>30 条</option>
              <option value={50}>50 条</option>
              <option value={100}>100 条</option>
            </select>
            <button
              onClick={loadCollected}
              disabled={listLoading}
              className="whitespace-nowrap px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {listLoading ? '加载中...' : '刷新列表'}
            </button>
          </div>
        </div>
        {listLoading ? (
          <div className="text-sm text-slate-500">加载中...</div>
        ) : collected.length === 0 ? (
          <div className="text-sm text-slate-600">最近 3 天暂无采集内容。</div>
        ) : (
          <div className="space-y-4">
            {collected.map((item) => (
              <div key={item.id} className="border border-slate-200 rounded-xl p-4">
                <div className="text-xs text-slate-500">{item.source_name}</div>
                <div className="text-sm font-medium text-slate-900">{item.title}</div>
                {item.summary && (
                  <SummaryBlock summary={parseSummary(item.summary)} variant="compact" />
                )}
                <div className="text-xs text-slate-400 mt-1">
                  {item.published_at ? new Date(item.published_at).toLocaleString() : '无发布时间'}
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  查看原文
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        {digest ? (
          <div className="space-y-5">
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
              <div className="text-slate-600">{digest.summary_text || emptyReasonText || '今天没有值得花时间的内容。'}</div>
            )}

            {digest.status === 'ready' && (
              <div className="space-y-6">
                {digest.summary_text && (
                  <div className="text-slate-600">{digest.summary_text}</div>
                )}
                {digestItems.map((item) => (
                  <div key={item.itemId} className="border border-slate-200 rounded-2xl p-5 space-y-4">
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <div className="text-xs text-slate-500">{item.source}</div>
                        <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                        重要性：{item.importance}
                      </span>
                    </div>
                    {item.summary && (
                      <SummaryBlock summary={parseSummary(item.summary)} />
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
                    <div className="space-y-3">
                      <textarea
                        className="w-full border border-slate-200 rounded-xl p-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
                          className="px-4 py-2 text-sm font-medium rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          记录观点
                        </button>
                      </div>
                      {replies[item.itemId] && (
                        <div className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-4">
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
