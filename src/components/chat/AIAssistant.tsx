/**
 * AI 助手主组件
 */
import React, { useState, useCallback } from 'react';
import { ChatWindow } from './ChatWindow';
import { FloatingButton } from './FloatingButton';

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
      {isOpen && <ChatWindow onClose={handleClose} />}
      <FloatingButton onClick={handleToggle} isOpen={isOpen} />
    </>
  );
};
