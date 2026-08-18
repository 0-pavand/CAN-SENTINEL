import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAppContext } from '../hooks/useAnalysisState';
import { useTranslation } from '../hooks/useTranslation';
import { analysisService } from '../services/AnalysisService';
import { Button } from '../components/ui/Button';

const PIPELINE_STAGE_KEYS = [
  'stageParsingLog',
  'stageParsingDbc',
  'stageLoadingModel',
  'stageRunningAnalysis',
  'stageAggregating',
  'stageFetchingResults'
];

export function ProgressPage() {
  const navigate = useNavigate();
  const { logFile, dbcFile, appState, setAppState, setCurrentStage, setSummary, setIncidents } = useAppContext();
  const { t } = useTranslation();
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const hasStartedRef = useRef(false);
  const isMountedRef = useRef(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (appState !== 'loading' || !logFile || !dbcFile) return;
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const runAnalysis = async () => {
      try {
        const result = await analysisService.analyze(logFile, dbcFile, (stage, _progress) => {
          if (!isMountedRef.current) return;
          setCurrentStage(stage);
          // Hardcoded English strings from the service -> map to key index
          const stageKeysEn = [
            'Parsing CAN log', 'Parsing DBC file', 'Loading ONNX model', 
            'Running analysis', 'Aggregating incidents', 'Fetching results'
          ];
          const index = stageKeysEn.indexOf(stage);
          if (index !== -1) {
            setActiveStageIndex(index);
          }
        });

        if (!isMountedRef.current) return;

        setSummary(result.summary);
        setIncidents(result.incidents);
        setAppState('success');
        
        // Brief pause at 100% before redirect
        timerRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            navigate('/results');
          }
        }, 600);

      } catch (err) {
        if (!isMountedRef.current) return;
        console.error(err);
        setAppState('error');
        setErrorMsg('Analysis could not be completed.');
      }
    };

    runAnalysis();
  }, [appState, logFile, dbcFile, navigate, setAppState, setCurrentStage, setSummary, setIncidents]);

  if (appState === 'error') {
    return (
      <div className="flex flex-col min-h-full p-6 items-center justify-center text-center bg-slate-50 dark:bg-[#0c0d10]">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-6 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
          <AlertCircle className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-widest">{t('analysisFailed')}</h2>
        <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-8 max-w-[280px] leading-relaxed">{errorMsg}</p>
        <Button 
          variant="outline" 
          onClick={() => {
            setAppState('idle');
            navigate('/import');
          }}
        >
          {t('tryAgain')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full px-6 py-12 bg-slate-50 dark:bg-[#0c0d10]">
      <div className="flex-1 max-w-sm w-full mx-auto flex flex-col justify-center">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-2">{t('analyzing')}</h2>
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#38bdf8] uppercase">{t('pleaseWait')}</span>
        </div>
        
        <div className="space-y-6 relative ml-4">
          {/* Vertical line behind */}
          <div className="absolute left-3 top-2 bottom-4 w-px bg-slate-200 dark:bg-slate-800 -z-10" />

          {PIPELINE_STAGE_KEYS.map((stageKey, index) => {
            const isCompleted = index < activeStageIndex || appState === 'success';
            const isActive = index === activeStageIndex && appState === 'loading';

            return (
              <div key={stageKey} className="flex items-center gap-6">
                <div className="shrink-0 relative bg-slate-50 dark:bg-[#0c0d10] py-1">
                  {isCompleted ? (
                    <div className="w-6 h-6 rounded-full bg-[#38bdf8] flex items-center justify-center shadow-[0_0_10px_rgba(56,189,248,0.4)]">
                      <CheckCircle2 className="w-4 h-4 text-white dark:text-[#0c0d10]" />
                    </div>
                  ) : isActive ? (
                    <div className="w-6 h-6 rounded-full border-2 border-[#38bdf8] bg-slate-50 dark:bg-[#0c0d10] flex items-center justify-center shadow-[0_0_10px_rgba(56,189,248,0.4)] relative">
                       <Loader2 className="w-4 h-4 text-[#38bdf8] animate-spin absolute" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121418] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                    </div>
                  )}
                </div>
                
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                  isActive ? 'text-slate-900 dark:text-white' : isCompleted ? 'text-slate-500 dark:text-slate-400' : 'text-slate-600'
                }`}>
                  {t(stageKey)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 tabular-nums">
            {t('framesProcessed')} <span className="text-[#38bdf8]">{activeStageIndex > 0 ? '...' : '0'}</span>
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 tabular-nums">
            {t('elapsedTime')} <span className="text-slate-900 dark:text-white">{activeStageIndex > 0 ? '...' : '0.0s'}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
