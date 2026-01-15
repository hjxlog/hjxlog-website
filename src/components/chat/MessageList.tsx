/**
 * 消息列表组件
 */
import React from 'react';
import ReactMarkdown from 'react-markdown';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  currentResponse: string;
  onQuickQuestion?: (question: string) => void;
  disabled?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isTyping,
  currentResponse,
  onQuickQuestion,
  disabled = false,
}) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentResponse]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <p className="text-4xl mb-4">🤖</p>
          <p>你好！我是 AI 助手</p>
          <p className="text-sm mt-2">可以问我关于这个网站的任何问题</p>
          <div className="mt-4 space-y-2">
            {onQuickQuestion && (
              <>
                <button
                  onClick={() => onQuickQuestion('这个人的技术栈是什么？')}
                  disabled={disabled}
                  className={`block w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                    disabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  这个人的技术栈是什么？
                </button>
                <button
                  onClick={() => onQuickQuestion('他写过哪些博客？')}
                  disabled={disabled}
                  className={`block w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                    disabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  他写过哪些博客？
                </button>
                <button
                  onClick={() => onQuickQuestion('介绍一下他的作品')}
                  disabled={disabled}
                  className={`block w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                    disabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  介绍一下他的作品
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-2 ${
              message.role === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            {message.role === 'assistant' ? (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            ) : (
              <p>{message.content}</p>
            )}
          </div>
        </div>
      ))}

      {isTyping && currentResponse && (
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-gray-100 text-gray-900">
            <ReactMarkdown>{currentResponse}</ReactMarkdown>
            <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};
