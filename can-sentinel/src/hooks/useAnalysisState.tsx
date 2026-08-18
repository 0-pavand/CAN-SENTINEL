import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AnalysisMetrics, AnomalyIncident, AnalysisStatus } from '../types';
import { FileDefinition } from '../services/FileService';

export type ThemeMode = 'light' | 'dark' | 'system';
import { Language } from '../i18n/translations';

interface AppContextProps {
  appState: AnalysisStatus;
  setAppState: (state: AnalysisStatus) => void;
  
  logFile: FileDefinition | null;
  setLogFile: (file: FileDefinition | null) => void;
  
  dbcFile: FileDefinition | null;
  setDbcFile: (file: FileDefinition | null) => void;

  summary: AnalysisMetrics | null;
  setSummary: (summary: AnalysisMetrics | null) => void;

  incidents: AnomalyIncident[];
  setIncidents: (incidents: AnomalyIncident[]) => void;

  currentStage: string;
  setCurrentStage: (stage: string) => void;
  
  clearAnalysis: () => void;

  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;

  language: Language;
  setLanguage: (lang: Language) => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [appState, setAppState] = useState<AnalysisStatus>('idle');
  const [logFile, setLogFile] = useState<FileDefinition | null>(null);
  const [dbcFile, setDbcFile] = useState<FileDefinition | null>(null);
  const [summary, setSummary] = useState<AnalysisMetrics | null>(null);
  const [incidents, setIncidents] = useState<AnomalyIncident[]>([]);
  const [currentStage, setCurrentStage] = useState<string>('');
  
  // Theme State
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme') as ThemeMode;
    return saved || 'system';
  });

  // Language State
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language') as Language;
    return saved || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    
    const isDark = 
      theme === 'dark' || 
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  // Listen for system theme changes if set to system
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const clearAnalysis = () => {
    setAppState('idle');
    setLogFile(null);
    setDbcFile(null);
    setSummary(null);
    setIncidents([]);
    setCurrentStage('');
  };

  return (
    <AppContext.Provider
      value={{
        appState, setAppState,
        logFile, setLogFile,
        dbcFile, setDbcFile,
        summary, setSummary,
        incidents, setIncidents,
        currentStage, setCurrentStage,
        clearAnalysis,
        theme, setTheme,
        language, setLanguage
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
