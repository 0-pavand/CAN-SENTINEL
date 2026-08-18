import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, Activity, ArrowLeft, ShieldAlert, Cpu, Hash, MessageSquareText } from 'lucide-react';
import { useAppContext } from '../hooks/useAnalysisState';
import { useTranslation } from '../hooks/useTranslation';
import { formatTime, formatDuration } from '../utils';
import { getDiagnosticInfo } from '../utils/diagnostics';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { incidents } = useAppContext();
  const { t } = useTranslation();
  const [showFrames, setShowFrames] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);

  const incident = incidents.find(i => i.id === id);

  if (!incident) {
    return (
      <div className="flex flex-col min-h-full items-center justify-center p-6 text-center">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">{t('incidentNotFound')}</h2>
        <button onClick={() => navigate(-1)} className="mt-4 text-[#38bdf8] font-bold uppercase tracking-wider text-xs hover:underline">{t('goBack')}</button>
      </div>
    );
  }

  const diagnostic = getDiagnosticInfo(incident);

  return (
    <div className="flex flex-col min-h-full bg-slate-50 dark:bg-[#0c0d10] pb-safe">
      <header className="px-6 pt-[max(env(safe-area-inset-top),2rem)] pb-4 bg-slate-50 dark:bg-[#0c0d10] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-200 dark:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-900 dark:text-white" />
          </button>
          <div className="flex flex-col items-center flex-1">
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#38bdf8] uppercase">{t('incidentDetailsTitle')}</span>
            <h1 className="text-lg font-black text-slate-900 dark:text-white leading-none mt-1">{incident.id.toUpperCase()}</h1>
          </div>
          <button 
            onClick={() => navigate(`/chat?incidentId=${incident.id}`)}
            className="p-2 rounded-xl bg-[#38bdf8]/10 border border-[#38bdf8]/20 text-[#38bdf8] hover:bg-[#38bdf8]/20 transition-colors flex items-center gap-2"
          >
            <MessageSquareText className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        <div className="mb-4 mt-2">
          <div className="flex items-center justify-between mb-3">
            <Badge severity={incident.severity}>{t(incident.severity.toLowerCase())}</Badge>
            <span className="text-[10px] text-slate-500 font-mono font-bold">ID: {incident.id.split('-').pop()}</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{diagnostic.title}</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {diagnostic.explanation}
          </p>
        </div>

        <div className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-lg">
          <h2 className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-500 mb-4">{t('ruleEvidence')} & {t('deepLearning')}</h2>
          
          <div className="space-y-4">
            <div className="p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('severity')}</span>
                <span className={`text-xs font-black tracking-widest uppercase`}>{t(incident.severity.toLowerCase())}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('duration')}</span>
                <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">{formatDuration(incident.duration)}ms</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('affectedCanIds')}</span>
                <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                  {incident.canIds.map(id => (
                    <span key={id} className="text-[10px] font-mono font-black bg-slate-100 dark:bg-[#1e2128] px-1.5 py-0.5 rounded text-slate-900 dark:text-white">{id}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-400">{t('whatShouldIDo')}</h3>
          </div>
          <ul className="space-y-3">
            {diagnostic.troubleshooting.map((step, idx) => (
              <li key={idx} className="text-sm text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
                <span className="shrink-0 mt-0.5">•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Technical Details Accordion */}
        <div className="pt-2">
          <button 
            onClick={() => setShowTechnical(!showTechnical)}
            className="w-full flex items-center justify-between p-4 bg-slate-100 dark:bg-[#1e2128] rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:bg-slate-800 transition-colors"
          >
            <span>Technical Details</span>
            {showTechnical ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {showTechnical && (
            <div className="mt-3 space-y-4">
              <div className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-2 divide-x divide-slate-800 border-b border-slate-200 dark:border-slate-800">
                  <div className="p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">Raw Anomaly Type</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase">{incident.anomalyType}</span>
                  </div>
                  <div className="p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">Peak DL Score</span>
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">{incident.dlScore?.toFixed(4) || 'N/A'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-800">
                  <div className="p-4 flex flex-col items-center justify-center text-center bg-white dark:bg-[#16181d]">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">Affected CAN IDs</span>
                    <div className="flex flex-wrap justify-center gap-1 mt-1">
                      {incident.canIds.map(id => (
                        <span key={id} className="text-xs font-mono font-black bg-slate-100 dark:bg-[#1e2128] px-2 py-0.5 rounded text-slate-900 dark:text-white">{id}</span>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 flex flex-col items-center justify-center text-center bg-white dark:bg-[#16181d]">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">Occurrences</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{incident.occurrences}</span>
                  </div>
                </div>
              </div>

              {incident.ruleEvidence && (
                <div className='flex items-start gap-4 bg-white dark:bg-[#121418] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl'>
                  <div className='w-1 h-12 bg-[#38bdf8] rounded-full shrink-0'></div>
                  <div>
                    <p className='text-xs text-slate-500 uppercase font-bold tracking-wider mb-2'>Rule Evidence</p>
                    <p className='text-sm text-slate-900 dark:text-white italic leading-relaxed'>{incident.ruleEvidence}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Supporting Frames */}
        <div className="pt-2 pb-8">
          <button 
            onClick={() => setShowFrames(!showFrames)}
            className="w-full flex items-center justify-between p-4 bg-slate-100 dark:bg-[#1e2128] rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:bg-slate-800 transition-colors"
          >
            <span>Supporting Frames ({incident.frames.length})</span>
            {showFrames ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {showFrames && (
            <div className="mt-3 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-[#121418]">
              {incident.frames.length === 0 ? (
                <div className="p-6 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">No frames available</div>
              ) : (
                <div className="divide-y divide-slate-800 max-h-[400px] overflow-y-auto hide-scrollbar">
                  {incident.frames.map((frame, idx) => (
                    <div key={idx} className="p-4 flex flex-col gap-2 hover:bg-white dark:bg-[#16181d] transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">{frame.timestamp.toFixed(3)}s</span>
                        <span className="font-mono text-xs font-black text-[#38bdf8]">{frame.canId}</span>
                      </div>
                      <div className="flex justify-between items-end mt-1">
                        <div>
                          {frame.signal && <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">{frame.signal}: <span className="text-slate-900 dark:text-white font-black">{frame.value}</span></span>}
                        </div>
                        {frame.rawPayload && (
                          <span className="font-mono text-slate-600 text-[10px] font-bold tracking-[0.2em]">{frame.rawPayload}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
