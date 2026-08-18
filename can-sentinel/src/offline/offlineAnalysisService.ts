/**
 * Offline CAN Analysis Service.
 * Runs the complete pipeline locally — no FastAPI required.
 *
 * Pipeline:
 *   CAN.log → ASCParser → DbcDecoder → FeaturePipeline
 *   → RuleDetectors + OnnxPredictor (hybrid) → IncidentAggregator
 *   → AnalysisResultResponse (same shape as API)
 */

import { parseAscLog } from './ascParser';
import { parseDbcFile, decodeFrame } from './dbcParser';
import { StateTracker, processFrame } from './featurePipeline';
import { TimeoutDetector, runAllRuleDetectors } from './ruleDetectors';
import type { AnomalyAlert } from './ruleDetectors';
import { OnnxPredictor } from './onnxPredictor';
import { aggregateAlerts } from './incidentAggregator';

// Result shape matches the existing API client types so existing UI works unchanged
export interface OfflineAnalysisResult {
  status: 'complete' | 'failed';
  totalFrames: number;
  decodedFrames: number;
  uniqueCanIds: number;
  anomalies: OfflineAnomalyAlert[];
  incidents: OfflineIncident[];
  executionTime: number;
  error?: string;
  dlEnabled: boolean;
}

export interface OfflineAnomalyAlert {
  timestamp: number;
  canId: number | null;
  anomalyType: string;
  severity: string;
  description: string;
  isRuleViolation: boolean;
  dlScore?: number;
  ruleEvidence: string[];
}

export interface OfflineIncident {
  startTime: number;
  endTime: number;
  duration: number;
  primaryAnomalyType: string;
  severity: string;
  description: string;
  affectedCanIds: number[];
  occurrences: number;
  peakDlScore: number | null;
  allRuleEvidence: string[];
}

const SEQUENCE_LENGTH = 16;
const DL_THRESHOLD = 0.5;

// Singleton predictor (loaded once, reused)
let predictor: OnnxPredictor | null = null;
let predictorInitialized = false;
let predictorError: string | null = null;

async function getPredictor(): Promise<OnnxPredictor | null> {
  if (predictorInitialized) return predictorError ? null : predictor;

  try {
    predictor = new OnnxPredictor();
    await predictor.initialize('/assets/can_net.onnx', '/assets/scaler_config.json');
    predictorInitialized = true;
    console.log('[OfflineAnalysis] ONNX model loaded successfully');
    return predictor;
  } catch (err) {
    predictorError = String(err);
    predictorInitialized = true;
    console.error('[OfflineAnalysis] ONNX init failed — DL inference disabled:', err);
    return null;
  }
}

export async function runOfflineAnalysis(
  logContent: string,
  dbcContent: string,
  onProgress?: (msg: string) => void
): Promise<OfflineAnalysisResult> {
  const startTime = performance.now();

  try {
    onProgress?.('Parsing CAN log...');
    const frames = parseAscLog(logContent);
    if (frames.length === 0) {
      return { status: 'failed', totalFrames: 0, decodedFrames: 0, uniqueCanIds: 0,
        anomalies: [], incidents: [], executionTime: 0, dlEnabled: false,
        error: 'No valid CAN frames found in log file.' };
    }

    onProgress?.('Parsing DBC file...');
    const db = parseDbcFile(dbcContent);

    onProgress?.('Loading ONNX model...');
    const pred = await getPredictor();
    const dlEnabled = pred !== null;
    if (!dlEnabled) {
      onProgress?.(`Warning: DL inference unavailable (${predictorError}). Using rules only.`);
    }

    onProgress?.('Running analysis...');

    const state = new StateTracker();
    const timeoutDet = new TimeoutDetector(3.0);
    const featureBuffer: Array<Record<string, number>> = [];

    const allAlerts: AnomalyAlert[] = [];
    let decodedFrames = 0;
    const seenIds = new Set<number>();

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      seenIds.add(frame.arbitrationId);

      // Try DBC decode
      let decoded = null;
      const msgDef = db.messages.get(frame.arbitrationId);
      if (msgDef && frame.dlc === msgDef.length) {
        try {
          decoded = decodeFrame(frame.data, msgDef, frame.timestamp);
          decodedFrames++;
        } catch {
          // DBC decode error — treat as undecodable
        }
      }

      // Extract features
      const features = processFrame(frame, decoded, state);

      // Rule detectors
      const ruleAlerts = runAllRuleDetectors(features, state, timeoutDet);
      allAlerts.push(...ruleAlerts);

      // DL: maintain sliding window
      if (dlEnabled && pred) {
        featureBuffer.push(features);
        if (featureBuffer.length > SEQUENCE_LENGTH) featureBuffer.shift();

        if (featureBuffer.length === SEQUENCE_LENGTH) {
          try {
            const dlScore = await pred.predict(featureBuffer);
            if (dlScore >= DL_THRESHOLD && ruleAlerts.length === 0) {
              // Pure DL anomaly — only report if no rule already caught it
              allAlerts.push({
                timestamp: frame.timestamp,
                canId: frame.arbitrationId,
                anomalyType: 'DL Anomaly',
                severity: 'MEDIUM',
                description: `Deep learning temporal anomaly (score: ${dlScore.toFixed(2)})`,
                isRuleViolation: false,
                dlScore,
                ruleEvidence: [`Deep Learning: Anomalous temporal pattern (Score: ${dlScore.toFixed(2)})`],
              });
            }
            // Attach DL score to most recent rule alerts for this frame
            if (ruleAlerts.length > 0) {
              const last = allAlerts[allAlerts.length - ruleAlerts.length];
              if (last) last.dlScore = dlScore;
            }
          } catch (e) {
            console.warn('[OfflineAnalysis] ONNX predict error:', e);
          }
        }
      }
    }

    onProgress?.('Aggregating incidents...');
    const incidents = aggregateAlerts(allAlerts, 1.0);

    const executionTime = (performance.now() - startTime) / 1000;

    return {
      status: 'complete',
      totalFrames: frames.length,
      decodedFrames,
      uniqueCanIds: seenIds.size,
      anomalies: allAlerts.map(a => ({
        timestamp: a.timestamp,
        canId: a.canId,
        anomalyType: a.anomalyType,
        severity: a.severity,
        description: a.description,
        isRuleViolation: a.isRuleViolation,
        dlScore: a.dlScore,
        ruleEvidence: a.ruleEvidence,
      })),
      incidents: incidents.map(i => ({
        startTime: i.startTime,
        endTime: i.endTime,
        duration: i.duration,
        primaryAnomalyType: i.primaryAnomalyType,
        severity: i.severity,
        description: i.description,
        affectedCanIds: i.affectedCanIds,
        occurrences: i.occurrences,
        peakDlScore: i.peakDlScore,
        allRuleEvidence: i.allRuleEvidence,
      })),
      executionTime,
      dlEnabled,
    };
  } catch (err) {
    const executionTime = (performance.now() - startTime) / 1000;
    return {
      status: 'failed',
      totalFrames: 0, decodedFrames: 0, uniqueCanIds: 0,
      anomalies: [], incidents: [],
      executionTime,
      dlEnabled: false,
      error: String(err),
    };
  }
}
