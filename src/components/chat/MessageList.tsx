/**
 * 消息列表组件
 */
import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, Laptop, FileText, Palette } from 'lucide-react';

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
  const quickQuestions = useMemo(() => ([
    {
      id: 'tech',
      text: '博主主要擅长哪些技术领域？',
      Icon: Laptop,
      iconClassName: 'mr-2 text-blue-500',
    },
    {
      id: 'articles',
      text: '推荐几篇精选的技术文章',
      Icon: FileText,
      iconClassName: 'mr-2 text-green-500',
    },
    {
      id: 'works',
      text: '介绍一下博主的代表作品',
      Icon: Palette,
      iconClassName: 'mr-2 text-purple-500',
    },
  ]), []);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentResponse]);

  return (
    <div 
      className={`flex-1 hide-scrollbar ${
        messages.length === 0 
          ? 'overflow-hidden p-2' 
          : 'overflow-y-auto p-2 space-y-6'
      }`}
    >
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-3 shadow-sm">
            <Bot size={24} className="text-blue-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">你好，我是 AI 助手</h2>
          <p className="text-xs text-slate-500 max-w-[260px] leading-relaxed mb-4">
            你可以问我关于这个网站、项目或技术栈的任何问题。
          </p>
          <div className="w-full px-4 sm:px-6 space-y-2">
            {onQuickQuestion && quickQuestions.map((question) => (
              <button
                key={question.id}
                onClick={() => onQuickQuestion(question.text)}
                disabled={disabled}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all duration-300 border ${
                  disabled
                    ? 'bg-slate-50 text-slate-400 border-transparent cursor-not-allowed'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/60 shadow-sm hover:shadow-md'
                }`}
              >
                <span className="flex items-center">
                  <question.Icon size={14} className={question.iconClassName} />
                  {question.text}
                </span>
              </button>
            ))}
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
          <div className="max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm bg-white text-slate-800 border border-slate-100 rounded-tl-none">
            <div className="prose prose-sm prose-slate max-w-none">
              <ReactMarkdown>{currentResponse}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};
