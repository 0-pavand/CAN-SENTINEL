import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, ArrowRight } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../../types/chat';

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const isAssistant = message.role === 'assistant';
  const navigate = useNavigate();

  return (
    <div className={`flex w-full mb-6 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[85%] ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
          isAssistant 
            ? 'bg-[#38bdf8]/10 border border-[#38bdf8]/20 text-[#38bdf8] mr-3' 
            : 'bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-500 ml-3'
        }`}>
          {isAssistant ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}>
          <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isAssistant
              ? 'bg-white dark:bg-[#121418] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-tl-none shadow-sm'
              : 'bg-[#38bdf8] text-white dark:text-[#0c0d10] rounded-tr-none shadow-md font-medium'
          }`}>
            {message.content}
          </div>
        </div>
      </div>
    </div>
  );
}
