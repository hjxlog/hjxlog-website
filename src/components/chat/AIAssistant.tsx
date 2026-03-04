/**
 * AI 助手主组件
 */
import React, { useState, useCallback, lazy, Suspense } from 'react';
import { FloatingButton } from './FloatingButton';

const ChatWindow = lazy(() => import('./ChatWindow').then((mod) => ({
  default: mod.ChatWindow
})));

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      {isOpen && (
        <Suspense fallback={<div className="fixed bottom-24 right-4 sm:right-6 z-[100] rounded-2xl bg-white px-4 py-2 text-sm text-slate-500 shadow-md">加载助手中...</div>}>
          <ChatWindow onClose={handleClose} />
        </Suspense>
      )}
      <FloatingButton onClick={handleToggle} isOpen={isOpen} />
    </>
  );
};
