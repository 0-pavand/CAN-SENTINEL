export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

export type AnomalyType =
  | 'Out-of-Range'
  | 'Timing/Flood'
  | 'Logical Contradiction'
  | 'Message Timeout'
  | 'Data Corruption'
  | 'DL Temporal Anomaly'
  | string;

export interface FrameEvidence {
  timestamp: number;
  canId: string;
  signal?: string;
  value?: string | number;
  rawPayload?: string;
}

export interface Incident {
  id: string;
  anomalyType: AnomalyType;
  severity: Severity;
  startTime: number;
  endTime: number;
  duration: number; // in milliseconds
  canIds: string[];
  occurrences: number;
  dlScore?: number;
  ruleEvidence?: string;
  dlEvidence?: string;
  frames: FrameEvidence[];
}

export interface AnalysisSummary {
  framesProcessed: number;
  decodedMessages: number;
  incidents: number;
  precision: number | null;
  recall: number | null;
  f1: number | null;
  processingTime: number; // in seconds
  lastAnalysisDate: string;
}

export type AppState = 'idle' | 'loading' | 'success' | 'error';
