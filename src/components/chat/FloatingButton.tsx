/**
 * 悬浮按钮组件
 */
import React, { useEffect, useRef, useState } from 'react';
import { Bot, X } from 'lucide-react';
import type { FloatingPosition } from './AIAssistant';

interface FloatingButtonProps {
  onClick: () => void;
  isOpen: boolean;
  position: FloatingPosition | null;
  onPositionChange: (next: FloatingPosition) => void;
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({ onClick, isOpen, position, onPositionChange }) => {
  const buttonSize = 56;
  const margin = 16;
  const [isReady, setIsReady] = useState(false);
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    moved: false,
  });
  const preventClickRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem('ai-assistant-button-position');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { x: number; y: number };
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          onPositionChange(parsed);
          setIsReady(true);
          return;
        }
      } catch {
        // ignore invalid localStorage value
      }
    }

    onPositionChange({
      x: window.innerWidth - buttonSize - margin,
      y: window.innerHeight - buttonSize - margin,
    });
    setIsReady(true);
  }, [onPositionChange]);

  const clampPosition = (x: number, y: number) => {
    const maxX = Math.max(margin, window.innerWidth - buttonSize - margin);
    const maxY = Math.max(margin, window.innerHeight - buttonSize - margin);
    return {
      x: Math.min(Math.max(x, margin), maxX),
      y: Math.min(Math.max(y, margin), maxY),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!position) {
      return;
    }

    dragStateRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - position.x,
      offsetY: e.clientY - position.y,
      moved: false,
    };

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const state = dragStateRef.current;
    if (!state.isDragging) {
      return;
    }

    const deltaX = Math.abs(e.clientX - state.startX);
    const deltaY = Math.abs(e.clientY - state.startY);
    if (deltaX > 4 || deltaY > 4) {
      state.moved = true;
    }

    const next = clampPosition(e.clientX - state.offsetX, e.clientY - state.offsetY);
    onPositionChange(next);
  };

  const handlePointerUp = () => {
    const state = dragStateRef.current;
    if (!state.isDragging) {
      return;
    }

    state.isDragging = false;
    if (state.moved) {
      preventClickRef.current = true;
    }

    if (position) {
      localStorage.setItem('ai-assistant-button-position', JSON.stringify(position));
    }
  };

  const handleClick = () => {
    if (preventClickRef.current) {
      preventClickRef.current = false;
      return;
    }
    onClick();
  };

  if (!isReady || !position) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-50 bg-white/80 backdrop-blur-md text-slate-800 p-4 rounded-full shadow-lg border border-white/50 hover:shadow-xl hover:bg-white/90 transition-all duration-300 hover:scale-105 active:scale-95 group touch-none"
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
