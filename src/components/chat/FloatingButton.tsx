/**
 * 悬浮按钮组件
 */
import React from 'react';
import { Bot, X } from 'lucide-react';

interface FloatingButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({ onClick, isOpen }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 bg-white/80 backdrop-blur-md text-slate-800 p-4 rounded-full shadow-lg border border-white/50 hover:shadow-xl hover:bg-white/90 transition-all duration-300 hover:scale-105 active:scale-95 group"
      aria-label={isOpen ? "关闭AI助手" : "打开AI助手"}
    >
      {isOpen ? (
        <X className="h-6 w-6 text-slate-600 group-hover:text-slate-900 transition-colors" />
      ) : (
        <div className="relative">
          <Bot className="h-6 w-6 text-slate-600 group-hover:text-slate-900 transition-colors" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </span>
        </div>
      )}
    </button>
  );
};
