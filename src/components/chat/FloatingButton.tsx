/**
 * 悬浮按钮组件
 */
import React from 'react';

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
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600 group-hover:text-slate-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600 group-hover:text-slate-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </span>
        </div>
      )}
    </button>
  );
};
