import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUp, FileText, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { fileService } from '../services/FileService';
import { useAppContext } from '../hooks/useAnalysisState';
import { useTranslation } from '../hooks/useTranslation';
import { formatBytes } from '../utils';

export function ImportPage() {
  const navigate = useNavigate();
  const { logFile, setLogFile, dbcFile, setDbcFile, setAppState, setCurrentStage } = useAppContext();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  const handleSelectLog = async () => {
    try {
      setError(null);
      const file = await fileService.pickFile('log');
      if (file) setLogFile(file);
    } catch (e) {
      setError('Failed to select CAN log file.');
    }
  };

  const handleSelectDbc = async () => {
    try {
      setError(null);
      const file = await fileService.pickFile('dbc');
      if (file) setDbcFile(file);
    } catch (e) {
      setError('Failed to select DBC file.');
    }
  };

  const handleStartAnalysis = () => {
    if (!logFile || !dbcFile) return;
    setAppState('loading');
    setCurrentStage('Initializing');
    navigate('/progress');
  };

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-6 pt-[max(env(safe-area-inset-top),2rem)] pb-4 bg-slate-50 dark:bg-[#0c0d10] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 flex flex-col">
        <span className="text-[10px] font-bold tracking-[0.2em] text-[#38bdf8] uppercase">Setup</span>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-1">{t('importTitle')}</h1>
      </header>

      <div className="flex-1 p-6 space-y-8 flex flex-col">
        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold leading-relaxed tracking-wider uppercase">
          Select a CAN log file and its corresponding DBC decoding file to begin analysis.
        </p>

        {error && (
          <div className="bg-rose-500/10 border-2 border-rose-500/20 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-rose-200">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <FileSelectorCard
            title={t('selectCanLog')}
            icon={<FileText className="w-6 h-6 text-[#38bdf8]" />}
            file={logFile}
            onClick={handleSelectLog}
            acceptText=".log"
            t={t}
          />

          <FileSelectorCard
            title={t('selectDbc')}
            icon={<Database className="w-6 h-6 text-[#38bdf8]" />}
            file={dbcFile}
            onClick={handleSelectDbc}
            acceptText=".dbc"
            t={t}
          />
        </div>

        <div className="mt-auto pt-6">
          <Button
            className="w-full h-16 rounded-2xl text-sm"
            size="lg"
            disabled={!logFile || !dbcFile}
            onClick={handleStartAnalysis}
          >
            {t('startAnalysis')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function FileSelectorCard({
  title,
  icon,
  file,
  onClick,
  acceptText,
  t
}: {
  title: string;
  icon: React.ReactNode;
  file: any;
  onClick: () => void;
  acceptText: string;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase pl-1">{title}</h3>
      <div 
        className={`cursor-pointer transition-all active:scale-[0.98] rounded-2xl border-2 ${
          file ? 'border-[#38bdf8] bg-[#38bdf8]/5' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121418] hover:border-slate-300 dark:border-slate-700'
        }`}
        onClick={onClick}
      >
        <div className="p-5 flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#1e2128] flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700 shadow-inner">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            {file ? (
              <>
                <p className="text-sm font-black text-slate-900 dark:text-white truncate">{file.name}</p>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">{formatBytes(file.size)}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-black text-slate-600 dark:text-slate-300 uppercase">Select file...</p>
                <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">{acceptText}</p>
              </>
            )}
          </div>
          <div className="shrink-0">
            {file ? (
              <CheckCircle2 className="w-6 h-6 text-[#38bdf8]" />
            ) : (
              <FileUp className="w-6 h-6 text-slate-600" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
