import { mockIncidents, mockSummary } from '../data/mockAnalysis';
import { AnalysisSummary, Incident } from '../types';
import { FileDefinition } from './FileService';

export interface AnalysisResult {
  summary: AnalysisSummary;
  incidents: Incident[];
}

export type ProgressCallback = (stage: string, progress: number) => void;

export interface AnalysisService {
  analyze(
    logFile: FileDefinition,
    dbcFile: FileDefinition,
    onProgress?: ProgressCallback
  ): Promise<AnalysisResult>;
}

export class MockAnalysisService implements AnalysisService {
  async analyze(
    logFile: FileDefinition,
    dbcFile: FileDefinition,
    onProgress?: ProgressCallback
  ): Promise<AnalysisResult> {
    
    const stages = [
      'Parsing CAN traffic',
      'Decoding CAN messages',
      'Extracting features',
      'Running rule detection',
      'Running DL inference',
      'Aggregating incidents'
    ];

    for (let i = 0; i < stages.length; i++) {
      if (onProgress) {
        onProgress(stages[i], ((i + 1) / stages.length) * 100);
      }
      // Wait roughly 400ms per stage so it completes in ~2.5 seconds total
      await new Promise(resolve => setTimeout(resolve, 400)); 
    }

    return {
      summary: mockSummary,
      incidents: mockIncidents
    };
  }
}

import { OfflineAnalysisService } from './OfflineAnalysisService';

export const analysisService: AnalysisService = new OfflineAnalysisService();
