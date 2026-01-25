
import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const VIEW_API_URL = '/api/view/report';
const REPORT_INTERVAL = 3000;

interface ViewItem {
  type: string;
  id: number;
  path: string;
}

// 全局待上报队列
const pendingQueue: Map<string, ViewItem> = new Map();
let reportTimer: ReturnType<typeof setTimeout> | null = null;

const makeKey = (type: string, id: number, path: string) => `${type}:${id}:${path}`;

const addToQueue = (type: string, id: number, path: string) => {
  const key = makeKey(type, id, path);
  if (!pendingQueue.has(key)) {
    pendingQueue.set(key, { type, id, path });
  }

  if (!reportTimer) {
    reportTimer = setTimeout(flushQueue, REPORT_INTERVAL);
  }
};

const flushQueue = async () => {
  if (pendingQueue.size === 0) {
    reportTimer = null;
    return;
  }

  const items = Array.from(pendingQueue.values());
  pendingQueue.clear();
  reportTimer = null;

  try {
    const token = localStorage.getItem('token');
    await fetch(VIEW_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ items })
    });
  } catch (error) {
    console.error('Failed to report views:', error);
    // 失败不重试，避免死循环
  }
};

/**
 * 通用浏览追踪 Hook
 * @param type 资源类型 (blog, moment, work, page)
 * @param id 资源ID (可选，page类型可不传)
 * @param autoTrack 是否自动触发 (默认为true，对于列表中的项可设为false由IntersectionObserver触发)
 */
export const useViewTracker = (type: string, id: number = 0, autoTrack: boolean = true) => {
  const location = useLocation();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (autoTrack && !hasTracked.current) {
      addToQueue(type, id, location.pathname);
      hasTracked.current = true;
    }
  }, [type, id, autoTrack, location.pathname]);

  // 手动触发函数 (用于 IntersectionObserver)
  const track = useCallback(() => {
    if (!hasTracked.current) {
      addToQueue(type, id, location.pathname);
      hasTracked.current = true;
    }
  }, [type, id, location.pathname]);

  return { track };
};
