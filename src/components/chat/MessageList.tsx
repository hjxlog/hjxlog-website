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
    <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
            <span className="text-3xl">🤖</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Hello, I'm AI Assistant</h2>
          <p className="text-sm text-slate-500 max-w-[240px] leading-relaxed mb-8">
            Ask me anything about this website, projects, or technical stack.
          </p>
          <div className="w-full space-y-3">
            {onQuickQuestion && (
              <>
                <button
                  onClick={() => onQuickQuestion('这个人的技术栈是什么？')}
                  disabled={disabled}
                  className={`w-full text-left px-5 py-3.5 rounded-2xl text-sm transition-all duration-300 border ${
                    disabled
                      ? 'bg-slate-50 text-slate-400 border-transparent cursor-not-allowed'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/60 shadow-sm hover:shadow-md'
                  }`}
                >
                  <span className="mr-2">💻</span> 这个人的技术栈是什么？
                </button>
                <button
                  onClick={() => onQuickQuestion('他写过哪些博客？')}
                  disabled={disabled}
                  className={`w-full text-left px-5 py-3.5 rounded-2xl text-sm transition-all duration-300 border ${
                    disabled
                      ? 'bg-slate-50 text-slate-400 border-transparent cursor-not-allowed'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/60 shadow-sm hover:shadow-md'
                  }`}
                >
                  <span className="mr-2">📝</span> 他写过哪些博客？
                </button>
                <button
                  onClick={() => onQuickQuestion('介绍一下他的作品')}
                  disabled={disabled}
                  className={`w-full text-left px-5 py-3.5 rounded-2xl text-sm transition-all duration-300 border ${
                    disabled
                      ? 'bg-slate-50 text-slate-400 border-transparent cursor-not-allowed'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/60 shadow-sm hover:shadow-md'
                  }`}
                >
                  <span className="mr-2">🎨</span> 介绍一下他的作品
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
            className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
              message.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-none'
                : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
            }`}
          >
            {message.role === 'assistant' ? (
              <div className="prose prose-sm prose-slate max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
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
