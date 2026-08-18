import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './hooks/useAnalysisState';
import { MobileLayout } from './layouts/MobileLayout';
import { HomePage } from './pages/HomePage';
import { ImportPage } from './pages/ImportPage';
import { ProgressPage } from './pages/ProgressPage';
import { ResultsPage } from './pages/ResultsPage';
import { IncidentDetailPage } from './pages/IncidentDetailPage';
import { SettingsPage } from './pages/SettingsPage';
import { ChatPage } from './pages/ChatPage';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MobileLayout />}>
            <Route index element={<HomePage />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="results" element={<ResultsPage />} />
            <Route path="incidents/:id" element={<IncidentDetailPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
