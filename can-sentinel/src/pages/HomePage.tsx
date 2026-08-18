import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Activity, Cpu, WifiOff, ChevronRight } from 'lucide-react';
import { useAppContext } from '../hooks/useAnalysisState';
import { useTranslation } from '../hooks/useTranslation';
import { Button } from '../components/ui/Button';
import { formatNumber, formatTime } from '../utils';

export function HomePage() {
  const navigate = useNavigate();
  const { summary, appState } = useAppContext();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="px-6 py-6 pt-[max(env(safe-area-inset-top),2rem)] bg-slate-50 dark:bg-[#0c0d10] border-b border-slate-200 dark:border-slate-800 flex flex-col">
        <span className='text-[10px] font-bold tracking-[0.2em] text-[#38bdf8] uppercase'>Engineering Suite</span>
        <h1 className='text-4xl font-black text-slate-900 dark:text-white leading-none mt-1'>{t('appTitle').split(' ')[0]}<br/>{t('appTitle').split(' ').slice(1).join(' ') || 'SENTINEL'}</h1>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6">
        
        {/* Status */}
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 rounded-2xl bg-[#38bdf8]/10 flex items-center justify-center mb-4 border border-[#38bdf8]/20 shadow-[0_0_15px_rgba(56,189,248,0.15)]">
            <Activity className="w-8 h-8 text-[#38bdf8]" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">SYSTEM READY</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">{t('appSubtitle')}</p>
          <Button 
            className="mt-8 w-full max-w-[280px]" 
            size="lg"
            onClick={() => navigate('/import')}
          >
            {t('startNewAnalysis')}
          </Button>
        </div>

        {/* System Status Card */}
        <div className='bg-white dark:bg-[#121418] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl'>
            <h2 className='text-[10px] font-bold text-slate-500 uppercase tracking-widest'>System Metrics</h2>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-[10px] text-slate-500 font-bold uppercase'>Backend API</p>
                <p className='text-sm font-black text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2'>
                  <span className='w-2 h-2 rounded-full bg-slate-600'></span>
                  MOCK MODE
                </p>
              </div>
              <div>
                <p className='text-[10px] text-slate-500 font-bold uppercase'>DL Model</p>
                <p className='text-sm font-black text-slate-900 dark:text-white mt-1'>v1.2 LOADED</p>
              </div>
              <div>
                <p className='text-[10px] text-slate-500 font-bold uppercase'>Offline Status</p>
                <p className='text-sm font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2'>
                  <WifiOff className="w-3 h-3 text-slate-500" />
                  PENDING
                </p>
              </div>
            </div>
        </div>

        {/* Last Analysis */}
        {summary && (
          <div className="space-y-4 pb-4">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Analysis</h3>
            <div 
              className="bg-white dark:bg-[#16181d] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl active:scale-[0.98] transition-transform cursor-pointer flex items-center justify-between"
              onClick={() => navigate('/results')}
            >
                <div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-2">
                    {formatNumber(summary.framesProcessed)} <span className="text-[10px] text-slate-500 uppercase tracking-widest ml-1">Frames</span>
                  </div>
                  <div className="text-xs font-bold text-rose-500 uppercase tracking-wider">
                    {summary.incidents} Incidents
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-600" />
            </div>
            <div className="text-center mt-2">
              <span className="text-[10px] text-[#38bdf8] uppercase tracking-widest font-bold cursor-pointer" onClick={() => navigate('/results')}>{t('viewLastResults')}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
