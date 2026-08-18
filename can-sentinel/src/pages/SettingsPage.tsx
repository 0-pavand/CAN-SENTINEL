import React from 'react';
import { Settings as SettingsIcon, Shield, Trash2, Smartphone, Monitor, Globe } from 'lucide-react';
import { useAppContext } from '../hooks/useAnalysisState';
import { Button } from '../components/ui/Button';
import { useTranslation } from '../hooks/useTranslation';
import { Language } from '../i18n/translations';

export function SettingsPage() {
  const { clearAnalysis, summary, theme, setTheme, language, setLanguage } = useAppContext();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-6 py-6 pt-[max(env(safe-area-inset-top),2rem)] bg-slate-50 dark:bg-[#0c0d10] border-b border-slate-200 dark:border-slate-800 flex justify-between items-end sticky top-0 z-10">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-none">{t('settingsTitle')}</h1>
        <span className="text-[10px] text-slate-500 font-mono tracking-widest">{t('system')}</span>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        
        <section>
          <h2 className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-500 mb-3 pl-1">{t('language')}</h2>
          <div className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-lg p-4">
             <div className="flex gap-2 flex-wrap">
              {(['en', 'ta', 'te', 'hi'] as Language[]).map((lang) => (
                <Button 
                  key={lang}
                  variant={language === lang ? 'default' : 'outline'} 
                  size="sm" 
                  className="flex-1 min-w-[70px]"
                  onClick={() => setLanguage(lang)}
                >
                  {lang === 'en' ? 'English' : lang === 'ta' ? 'தமிழ்' : lang === 'te' ? 'తెలుగు' : 'हिन्दी'}
                </Button>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-500 mb-3 pl-1">{t('analysisConfiguration')}</h2>
          <div className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800 text-sm shadow-lg">
            <div className="p-4 flex items-center justify-between">
              <div>
                <div className="font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">{t('detectionMode')}</div>
                <div className="text-slate-500 dark:text-slate-400 font-bold text-xs tracking-wider">{t('hybridMode')}</div>
              </div>
              <div className="w-12 h-6 bg-[#38bdf8] rounded-full flex items-center p-1 justify-end border border-slate-300 dark:border-slate-700 shadow-[0_0_10px_rgba(56,189,248,0.3)]">
                <div className="w-4 h-4 bg-slate-50 dark:bg-[#0c0d10] rounded-full" />
              </div>
            </div>
            <div className="p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">{t('dlModel')}</span>
                <span className="text-slate-900 dark:text-white font-mono font-bold text-xs">LSTM-AutoEncoder v1.2</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">{t('ruleEngine')}</span>
                <span className="text-slate-900 dark:text-white font-mono font-bold text-xs">J1939 Strict</span>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-500 mb-3 pl-1">{t('appearance')}</h2>
          <div className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('theme')}</div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={theme === 'light' ? 'default' : 'outline'} 
                size="sm" 
                className="flex-1"
                onClick={() => setTheme('light')}
              >
                {t('light')}
              </Button>
              <Button 
                variant={theme === 'dark' ? 'default' : 'outline'} 
                size="sm" 
                className="flex-1"
                onClick={() => setTheme('dark')}
              >
                {t('dark')}
              </Button>
              <Button 
                variant={theme === 'system' ? 'default' : 'outline'} 
                size="sm" 
                className="flex-1"
                onClick={() => setTheme('system')}
              >
                System
              </Button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-500 mb-3 pl-1">{t('storage')}</h2>
          <div className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden p-4 shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">{t('analysisHistory')}</div>
                <div className="text-slate-500 dark:text-slate-400 font-bold text-xs tracking-wider">
                  {summary ? t('hasUnsavedResults') : t('noActiveAnalysis')}
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full text-rose-500 border-2 border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-400 font-black tracking-widest text-xs uppercase h-12 rounded-xl"
              onClick={() => {
                if(window.confirm('Clear current analysis results?')) {
                  clearAnalysis();
                }
              }}
              disabled={!summary}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('clearCurrentAnalysis')}
            </Button>
          </div>
        </section>

        <section>
          <h2 className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-500 mb-3 pl-1">{t('about')}</h2>
          <div className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 shadow-lg">
            <div className="w-12 h-12 bg-slate-100 dark:bg-[#1e2128] rounded-xl flex items-center justify-center border border-slate-300 dark:border-slate-700 shadow-inner">
              <Shield className="w-6 h-6 text-[#38bdf8]" />
            </div>
            <div className="font-black text-slate-900 dark:text-white tracking-widest uppercase mt-1">CAN Sentinel</div>
            <div className="text-[10px] text-slate-500 font-mono font-bold">Build 2026.08.17</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-2 max-w-[200px] leading-relaxed">
              {t('appDescription')}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
