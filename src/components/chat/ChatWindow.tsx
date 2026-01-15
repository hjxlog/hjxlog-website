/**
 * 聊天窗口组件
 */
import React, { useState, useEffect } from 'react';
import { MessageList, Message } from './MessageList';
import { InputArea } from './InputArea';
import { API_BASE_URL } from '@/config/api';

interface ChatWindowProps {
  onClose: () => void;
}

interface QuotaData {
  remaining: number;
  globalRemaining: number;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
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

  const sendMessage = async (message: string) => {
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
            } catch (e) {
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
  };

  // 快捷问题点击
  const handleQuickQuestion = (question: string) => {
    if (!isTyping && quota.remaining > 0 && quota.globalRemaining > 0) {
      sendMessage(question);
    }
  };

  return (
    <div className="fixed bottom-20 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <h3 className="font-semibold">AI 助手</h3>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 p-1 rounded">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Quota warning */}
      {(quota.remaining === 0 || quota.globalRemaining === 0) && (
        <div className="mx-4 mt-4 p-3 bg-orange-100 text-orange-700 rounded-lg text-sm">
          📅 今日提问次数已达上限，请明天再试
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
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
