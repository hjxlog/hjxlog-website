import { useEffect, useRef } from 'react';

interface ShortcutOptions {
  onKeyDown: (event: KeyboardEvent) => void;
  enabled?: boolean;
}

/**
 * 全局快捷键Hook
 * 用法：useShortcut('cmd+k', callback)
 */
export const useShortcut = (
  keys: string,
  callback: () => void,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // 解析快捷键组合
      const [modifier, key] = keys.toLowerCase().split('+');
      const isCmd = event.metaKey || event.ctrlKey;

      if (
        isCmd &&
        event.key.toLowerCase() === key &&
        !event.shiftKey &&
        !event.altKey
      ) {
        event.preventDefault();
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keys, callback, enabled]);
};

/**
 * 多快捷键Hook
 * 用法：useShortcuts({ 'cmd+k': onOpen, 'escape': onClose })
 */
export const useShortcuts = (
  shortcuts: Record<string, () => void>,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isCmd = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      // Cmd/Ctrl + Key
      if (isCmd) {
        const shortcutKey = `cmd+${key}`;
        if (shortcuts[shortcutKey]) {
          event.preventDefault();
          shortcuts[shortcutKey]();
          return;
        }
      }

      // 单键
      if (shortcuts[key]) {
        event.preventDefault();
        shortcuts[key]();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
};
