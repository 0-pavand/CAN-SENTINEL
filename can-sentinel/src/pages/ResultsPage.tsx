import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Search, ChevronRight, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../hooks/useAnalysisState';
import { useTranslation } from '../hooks/useTranslation';
import { Badge } from '../components/ui/Badge';
import { formatNumber, formatTime } from '../utils';
import { Severity, AnomalyIncident } from '../types';

export function ResultsPage() {
  const navigate = useNavigate();
  const { summary, incidents } = useAppContext();
  const { t } = useTranslation();
  const [filterSeverity, setFilterSeverity] = useState<Severity | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  if (!summary) {
    return (
      <div className="flex flex-col min-h-full items-center justify-center p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-slate-600 mb-4" />
        <h2 className="text-xl font-black text-slate-900 dark:text-white">{t('noResultsTitle')}</h2>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2 mb-6">{t('noResultsSubtitle')}</p>
        <button 
          onClick={() => navigate('/import')}
          className="text-[#38bdf8] font-black text-xs uppercase tracking-wider hover:underline"
        >
          {t('goToImport')}
        </button>
      </div>
    );
  }

  const filteredIncidents = incidents.filter(inc => {
    if (filterSeverity !== 'All' && inc.severity !== filterSeverity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!inc.anomalyType.toLowerCase().includes(q) &&
          !inc.canIds.some(id => id.toLowerCase().includes(q))) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-6 py-6 pt-[max(env(safe-area-inset-top),2rem)] bg-slate-50 dark:bg-[#0c0d10] border-b border-slate-200 dark:border-slate-800 flex justify-between items-end sticky top-0 z-10">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-none">{t('analysisTitle')}</h1>
        <span className="text-[10px] text-slate-500 font-mono tracking-widest">{t('results')}</span>
      </header>

      <div className="flex-1 overflow-y-auto px-4">
        {/* Summary horizontal scroll */}
        <div className="py-4 space-y-4">
          <div className='bg-white dark:bg-[#16181d] rounded-2xl p-3 sm:p-4 grid grid-cols-4 divide-x divide-slate-200 dark:divide-slate-800/50 border border-slate-200 dark:border-slate-800/50'>
            <div className='text-center px-1'>
              <p className='text-sm sm:text-lg font-black text-slate-900 dark:text-white truncate'>{formatNumber(summary.framesProcessed)}</p>
              <p className='text-[8px] sm:text-[10px] uppercase font-bold text-slate-500 tracking-wider mt-1 truncate'>{t('frames')}</p>
            </div>
            <div className='text-center px-1'>
              <p className='text-sm sm:text-lg font-black text-slate-900 dark:text-white truncate'>{formatNumber(summary.decodedMessages)}</p>
              <p className='text-[8px] sm:text-[10px] uppercase font-bold text-slate-500 tracking-wider mt-1 truncate'>{t('decoded')}</p>
            </div>
            <div className='text-center px-1'>
              <p className='text-sm sm:text-lg font-black text-rose-500 truncate'>{summary.incidents}</p>
              <p className='text-[8px] sm:text-[10px] uppercase font-bold text-rose-500 tracking-wider mt-1 truncate'>{t('incidents')}</p>
            </div>
            <div className='text-center px-1'>
              <p className='text-sm sm:text-lg font-black text-[#38bdf8] truncate'>
                {summary.processingTime < 1 ? `${(summary.processingTime * 1000).toFixed(0)}ms` : `${summary.processingTime.toFixed(2)}s`}
              </p>
              <p className='text-[8px] sm:text-[10px] uppercase font-bold text-[#38bdf8] tracking-wider mt-1 truncate'>{t('processing')}</p>
            </div>
          </div>

          <div className='bg-white dark:bg-[#121418] rounded-2xl p-4 flex justify-around border border-slate-200 dark:border-slate-800/50 shadow-inner'>
            <div className='text-center'>
              <p className='text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1'>{t('precision')}</p>
              <p className='text-sm font-black text-emerald-400'>{summary.precision !== null ? `${(summary.precision * 100).toFixed(1)}%` : 'N/A'}</p>
            </div>
            <div className='text-center'>
              <p className='text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1'>{t('recall')}</p>
              <p className='text-sm font-black text-emerald-400'>{summary.recall !== null ? `${(summary.recall * 100).toFixed(1)}%` : 'N/A'}</p>
            </div>
            <div className='text-center'>
              <p className='text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1'>{t('f1Score')}</p>
              <p className='text-sm font-black text-emerald-400'>{summary.f1 !== null ? `${(summary.f1 * 100).toFixed(1)}%` : 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="py-3 sticky top-[73px] bg-slate-50 dark:bg-[#0c0d10] z-10 space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search CAN ID or type..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-[#1e2128] border-none rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#38bdf8]"
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {['All', 'Critical', 'High', 'Medium', 'Low'].map((sev) => {
              const isSelected = filterSeverity === sev;
              let bg = isSelected ? 'bg-[#38bdf8] text-white dark:text-[#0c0d10] shadow-[0_0_10px_rgba(56,189,248,0.4)]' : 'bg-slate-100 dark:bg-[#1e2128] text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700';
              if (isSelected && sev === 'Critical') bg = 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.4)] border border-rose-400';
              if (isSelected && sev === 'High') bg = 'bg-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.4)] border border-amber-400';
              if (isSelected && sev === 'Low') bg = 'bg-slate-500 text-white shadow-[0_0_10px_rgba(100,116,139,0.4)] border border-slate-400';
              
              return (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev as any)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${bg}`}
                >
                  {sev}
                </button>
              )
            })}
          </div>
        </div>

        {/* AnomalyIncident List */}
        <div className="space-y-4 pb-24 pt-2">
          {filteredIncidents.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm font-bold uppercase tracking-widest">
              No incidents found.
            </div>
          ) : (
            filteredIncidents.map(incident => (
              <IncidentCard key={incident.id} incident={incident} onClick={() => navigate(`/incidents/${incident.id}`)} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

import { getDiagnosticInfo } from '../utils/diagnostics';

function IncidentCard({ incident, onClick }: { incident: AnomalyIncident; onClick: () => void; key?: React.Key }) {
  const diagnostic = getDiagnosticInfo(incident);

  const getBorderColor = (sev: string) => {
    switch (sev) {
      case 'Critical': return 'border-rose-500';
      case 'High': return 'border-amber-500';
      case 'Medium': return 'border-[#38bdf8]';
      case 'Low': return 'border-slate-500';
      default: return 'border-slate-200 dark:border-slate-800';
    }
  };

  const getBgColor = (sev: string) => {
    switch (sev) {
      case 'Critical': return 'bg-slate-100 dark:bg-[#1e2128] shadow-lg';
      default: return 'bg-white dark:bg-[#16181d]';
    }
  };

  return (
    <div 
      className={`cursor-pointer transition-all active:scale-[0.98] p-4 rounded-2xl border-l-4 ${getBorderColor(incident.severity)} ${getBgColor(incident.severity)}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <Badge severity={incident.severity}>{incident.severity}</Badge>
        <span className="text-[10px] font-mono text-slate-500 font-bold">{incident.startTime.toFixed(2)}s &rarr; {incident.endTime.toFixed(2)}s</span>
      </div>
      
      <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1 leading-tight">{diagnostic.title}</h3>
      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium line-clamp-2 leading-relaxed mb-1">{diagnostic.explanation}</p>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-wide">{incident.duration} ms duration</p>

      <div className="mt-3 flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800/50">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Raw Type</span>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold max-w-[120px] truncate">{incident.anomalyType}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Affected System</span>
          <span className="text-[10px] font-mono text-slate-900 dark:text-white font-bold">{diagnostic.affectedArea}</span>
        </div>
      </div>
    </div>
  );
}
