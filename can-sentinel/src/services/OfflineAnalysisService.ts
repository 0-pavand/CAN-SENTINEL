/**
 * OfflineAnalysisService — implements the same AnalysisService interface
 * as FastAPIAnalysisService but runs the full pipeline locally in the browser/WebView.
 * No FastAPI server required.
 */

import { AnalysisService, AnalysisResult, ProgressCallback } from './AnalysisService';
import { FileDefinition } from './FileService';
import { Incident, FrameEvidence } from '../types';
import { runOfflineAnalysis } from '../offline/offlineAnalysisService';

function normalizeSeverity(sev: string): 'Critical' | 'High' | 'Medium' | 'Low' {
  const s = sev.toLowerCase();
  if (s === 'critical') return 'Critical';
  if (s === 'high') return 'High';
  if (s === 'medium' || s === 'med') return 'Medium';
  return 'Low';
}

export class OfflineAnalysisService implements AnalysisService {
  async analyze(
    logFile: FileDefinition,
    dbcFile: FileDefinition,
    onProgress?: ProgressCallback
  ): Promise<AnalysisResult> {
    // Read files as text
    if (!logFile.raw) throw new Error('Log file has no raw content.');
    if (!dbcFile.raw) throw new Error('DBC file has no raw content.');

    const logContent = await logFile.raw.text();
    const dbcContent = await dbcFile.raw.text();

    const stageMessages = [
      'Parsing CAN log',
      'Parsing DBC file',
      'Loading ONNX model',
      'Running analysis',
      'Aggregating incidents',
    ];

    let stageIdx = 0;
    const progressHandler = (msg: string) => {
      if (onProgress) {
        // Map to a stage index if possible
        const idx = stageMessages.indexOf(msg);
        if (idx !== -1) stageIdx = idx;
        const progress = Math.round(((stageIdx + 1) / stageMessages.length) * 95);
        onProgress(msg, progress);
      }
    };

    const result = await runOfflineAnalysis(logContent, dbcContent, progressHandler);

    if (result.status === 'failed') {
      throw new Error(result.error || 'Offline analysis failed.');
    }

    if (onProgress) onProgress('Fetching results', 100);

    // Map incidents to the same Incident shape the UI expects
    let incidentCounter = 0;
    const mappedIncidents: Incident[] = result.incidents.map(apiInc => {
      const frames: FrameEvidence[] = result.anomalies
        .filter(a => a.timestamp >= apiInc.startTime - 0.001 && a.timestamp <= apiInc.endTime + 0.001)
        .map(a => ({
          timestamp: a.timestamp,
          canId: a.canId !== null
            ? `0x${a.canId.toString(16).toUpperCase().padStart(3, '0')}`
            : 'Unknown',
          value: a.dlScore,
          rawPayload: a.description,
        }));

      return {
        id: `inc-${++incidentCounter}`,
        anomalyType: apiInc.primaryAnomalyType,
        severity: normalizeSeverity(apiInc.severity),
        startTime: apiInc.startTime,
        endTime: apiInc.endTime,
        duration: apiInc.duration,
        canIds: apiInc.affectedCanIds.map(
          id => `0x${id.toString(16).toUpperCase().padStart(3, '0')}`
        ),
        occurrences: apiInc.occurrences,
        dlScore: apiInc.peakDlScore ?? undefined,
        ruleEvidence: apiInc.allRuleEvidence.join(', '),
        frames,
      };
    });

    return {
      summary: {
        framesProcessed: result.totalFrames,
        decodedMessages: result.decodedFrames,
        incidents: result.incidents.length,
        precision: null,
        recall: null,
        f1: null,
        processingTime: result.executionTime,
        lastAnalysisDate: new Date().toISOString(),
      },
      incidents: mappedIncidents,
    };
  }
}
