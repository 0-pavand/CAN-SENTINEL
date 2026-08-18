import { AnalysisMetrics, AnomalyIncident } from './index';
import { Language } from '../i18n/translations';

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  incidentIdReference?: string; // Optional incident ID for the [View Incident] button
}

export interface ChatContext {
  summary: AnalysisMetrics | null;
  incidents: AnomalyIncident[];
  selectedIncidentId?: string;
  language?: Language;
}
