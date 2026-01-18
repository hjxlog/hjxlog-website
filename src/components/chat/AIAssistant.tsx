/**
 * AI 助手主组件
 */
import React, { useState } from 'react';
import { ChatWindow } from './ChatWindow';
import { FloatingButton } from './FloatingButton';

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}
      <FloatingButton onClick={() => setIsOpen(!isOpen)} isOpen={isOpen} />
    </>
  );
};
