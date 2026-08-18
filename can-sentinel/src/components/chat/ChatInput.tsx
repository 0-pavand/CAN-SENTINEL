import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setText('');
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = '48px';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = '48px'; // reset to base
      const scrollHeight = el.scrollHeight;
      if (scrollHeight > 48 && scrollHeight < 150) {
        el.style.height = `${scrollHeight}px`;
      } else if (scrollHeight >= 150) {
        el.style.height = '150px';
      }
    }
  }, [text]);

  return (
    <div className="flex items-end gap-2 bg-slate-50 dark:bg-[#0c0d10] p-4 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 z-20">
      <div className="flex-1 bg-white dark:bg-[#121418] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden focus-within:border-[#38bdf8] focus-within:ring-1 focus-within:ring-[#38bdf8] transition-all flex items-center min-h-[48px]">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Ask about this analysis..."
          className="w-full bg-transparent border-none px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-0 resize-none max-h-[150px] hide-scrollbar"
          rows={1}
        />
      </div>
      <button
        onClick={handleSend}
        disabled={!text.trim() || disabled}
        className="shrink-0 w-12 h-12 rounded-2xl bg-[#38bdf8] text-white dark:text-[#0c0d10] flex items-center justify-center disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 transition-all active:scale-[0.96] shadow-[0_0_10px_rgba(56,189,248,0.2)] disabled:shadow-none"
      >
        <Send className="w-5 h-5 ml-1" />
      </button>
    </div>
  );
}
