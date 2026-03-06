/**
 * 聊天窗口组件
 */
import React, { useState, useEffect, useCallback } from 'react';
import { MessageList, Message } from './MessageList';
import { InputArea } from './InputArea';
import { API_BASE_URL } from '@/config/api';
import { Bot, X } from 'lucide-react';
import type { FloatingPosition } from './AIAssistant';

interface ChatWindowProps {
  onClose: () => void;
  anchorPosition: FloatingPosition;
}

interface QuotaData {
  remaining: number;
  globalRemaining: number;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onClose, anchorPosition }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  const [quota, setQuota] = useState<QuotaData>({
    remaining: 3,
    globalRemaining: 100,
  });

  // 获取配额信息
  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/chat/quota`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setQuota(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch quota:', error);
      }
    };

    fetchQuota();
  }, []);

  // 移动端锁定背景滚动
  useEffect(() => {
    const lockScroll = () => {
      if (window.innerWidth < 640) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };

    lockScroll();
    window.addEventListener('resize', lockScroll);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('resize', lockScroll);
    };
  }, []);

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    // 检查配额
    if (quota.remaining <= 0 || quota.globalRemaining <= 0) {
      setError('今日提问次数已达上限，请明天再试');
      return;
    }

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    setCurrentResponse('');
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error(errorData.message || '今日提问次数已达上限');
        }
        throw new Error('Network response was not ok');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.remaining !== undefined && data.globalRemaining !== undefined) {
                setQuota(prev => ({
                  ...prev,
                  remaining: data.remaining,
                  globalRemaining: data.globalRemaining,
                }));
              } else if (data.token) {
                fullResponse += data.token;
                setCurrentResponse(fullResponse);
              } else if (data.done) {
                // 完成
                const assistantMessage: Message = {
                  id: (Date.now() + 1).toString(),
                  role: 'assistant',
                  content: fullResponse,
                  timestamp: new Date(),
                };
                setMessages((prev) => [...prev, assistantMessage]);
                setCurrentResponse('');
                setIsTyping(false);
              } else if (data.error) {
                setError(data.error);
                setIsTyping(false);
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setError(error instanceof Error ? error.message : '抱歉，我遇到了一些问题，请稍后再试。');
      setIsTyping(false);
    }
  }, [quota]);

  // 快捷问题点击
  const handleQuickQuestion = useCallback((question: string) => {
    if (!isTyping && quota.remaining > 0 && quota.globalRemaining > 0) {
      sendMessage(question);
    }
  }, [isTyping, quota, sendMessage]);

  const buttonSize = 56;
  const margin = 16;
  const gap = 12;
  const isMobile = viewport.width < 640;
  const panelWidth = isMobile ? Math.min(viewport.width - margin * 2, 420) : 384;
  const panelHeight = isMobile
    ? Math.min(Math.round(viewport.height * 0.8), viewport.height - margin * 2)
    : Math.min(600, viewport.height - margin * 2);

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  const left = clamp(
    anchorPosition.x + buttonSize - panelWidth,
    margin,
    Math.max(margin, viewport.width - panelWidth - margin)
  );
  const preferredTop = anchorPosition.y - panelHeight - gap;
  const fallbackTop = anchorPosition.y + buttonSize + gap;
  const top = preferredTop >= margin ? preferredTop : fallbackTop;
  const clampedTop = clamp(top, margin, Math.max(margin, viewport.height - panelHeight - margin));

  return (
    <div
      style={{ left: `${left}px`, top: `${clampedTop}px`, width: `${panelWidth}px`, height: `${panelHeight}px` }}
      className="fixed bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl flex flex-col z-[100] border border-white/20 overflow-hidden ring-1 ring-black/5 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100/50 bg-white/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-100 to-purple-100 flex items-center justify-center border border-white shadow-sm">
            <Bot size={20} className="text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">AI 助手</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs text-slate-500">Online</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Quota warning */}
      {(quota.remaining === 0 || quota.globalRemaining === 0) && (
        <div className="mx-4 mt-4 p-3 bg-orange-50/80 backdrop-blur-sm text-orange-600 rounded-xl text-xs border border-orange-100 flex items-center gap-2">
          <span className="text-base">📅</span> 今日提问次数已达上限，请明天再试
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50/80 backdrop-blur-sm text-red-600 rounded-xl text-xs border border-red-100">
          {error}
        </div>
      )}

      {/* Messages */}
      <MessageList
        messages={messages}
        isTyping={isTyping}
        currentResponse={currentResponse}
        onQuickQuestion={handleQuickQuestion}
        disabled={quota.remaining <= 0 || quota.globalRemaining <= 0}
      />

      {/* Input */}
      <InputArea
        onSendMessage={sendMessage}
        disabled={isTyping || quota.remaining <= 0 || quota.globalRemaining <= 0}
      />
    </div>
  );
};
