import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Bot, Shield, ArrowRight } from 'lucide-react';
import { useAppContext } from '../hooks/useAnalysisState';
import { useTranslation } from '../hooks/useTranslation';
import { ChatMessage } from '../components/chat/ChatMessage';
import { ChatInput } from '../components/chat/ChatInput';
import { chatService } from '../services/chatService';
import { ChatMessage as ChatMessageType } from '../types/chat';
import { Button } from '../components/ui/Button';
import { DiagnosticEngine } from '../diagnostics/diagnosticEngine';

export function ChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { summary, incidents, language } = useAppContext();
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const incidentId = searchParams.get('incidentId');
  const incident = incidentId ? incidents.find(i => i.id === incidentId) : undefined;

  const hasAnalysis = summary && incidents.length > 0;
  
  const chatContext = { summary, incidents, selectedIncidentId: incidentId || undefined, language };

  const suggestedQuestions = hasAnalysis 
    ? chatService.getSuggestedQuestions(chatContext) 
    : [];

  const bottomAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomAnchorRef.current) {
      bottomAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await chatService.sendMessage(text, messages, chatContext);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      const errorMessage: ChatMessageType = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your request.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 dark:bg-[#0c0d10]">
      <header className="shrink-0 px-6 py-6 pt-[max(env(safe-area-inset-top),2rem)] bg-slate-50 dark:bg-[#0c0d10] border-b border-slate-200 dark:border-slate-800 flex flex-col z-20 sticky top-0">
        <span className="text-[10px] font-bold tracking-[0.2em] text-[#38bdf8] uppercase">Assistant</span>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-1">{t('appTitle').split(' ')[0]} {t('appTitle').split(' ').slice(1).join(' ') || 'SENTINEL'}</h1>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
          {incident ? t('diagnosticAssistant') : t('diagnosticAssistant')}
        </p>
      </header>

      <div className="flex-1 px-4 py-6">
        {!hasAnalysis ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-[#121418] flex items-center justify-center border border-slate-300 dark:border-slate-800">
              <Bot className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">No Analysis Available</h2>
              <p className="text-xs font-bold text-slate-500 max-w-[250px] mx-auto leading-relaxed">
                Import a CAN log and run an analysis to interact with the assistant.
              </p>
            </div>
            <Button onClick={() => navigate('/import')}>
              Analyze CAN Traffic
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center text-center space-y-4 mb-4 pt-4">
                <div className="w-12 h-12 rounded-2xl bg-[#38bdf8]/10 flex items-center justify-center border border-[#38bdf8]/20 text-[#38bdf8]">
                  <Bot className="w-6 h-6" />
                </div>
                {incident ? (
                  <div className="flex flex-col items-center">
                    <p className="text-sm font-bold text-slate-900 dark:text-white max-w-[85%] mx-auto mb-4 leading-relaxed">
                      {DiagnosticEngine.getIntroMessage(incident, language)}
                    </p>
                    <Link to={`/incidents/${incident.id}`} className="flex items-center gap-2 text-[10px] uppercase font-black text-[#38bdf8] hover:underline bg-[#38bdf8]/10 px-4 py-2 rounded-full">
                      {t('viewDetails')} <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                    {t('diagnosticAssistant')}
                  </p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              {messages.map(msg => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
            </div>

            {isTyping && (
              <div className="flex justify-start w-full mb-6">
                <div className="flex max-w-[85%] flex-row items-end">
                  <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 bg-[#38bdf8]/10 border border-[#38bdf8]/20 text-[#38bdf8] mr-3">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white dark:bg-[#121418] border border-slate-200 dark:border-slate-800 rounded-tl-none flex gap-1 items-center h-[44px]">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {!isTyping && suggestedQuestions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 pb-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-[#121418] border border-slate-200 dark:border-slate-800 hover:border-[#38bdf8]/50 text-[11px] font-bold text-slate-600 dark:text-slate-300 transition-colors active:scale-[0.98]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomAnchorRef} className="h-px w-full" />
          </div>
        )}
      </div>

      {hasAnalysis && (
        <ChatInput onSend={handleSendMessage} disabled={isTyping} />
      )}
    </div>
  );
}
