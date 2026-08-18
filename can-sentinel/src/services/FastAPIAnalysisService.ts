import { AnalysisService, AnalysisResult, ProgressCallback } from './AnalysisService';
import { FileDefinition } from './FileService';
import { ApiClient } from '../api/client';
import { Incident, FrameEvidence } from '../types';

export class FastAPIAnalysisService implements AnalysisService {
  async analyze(
    logFile: FileDefinition,
    dbcFile: FileDefinition,
    onProgress?: ProgressCallback
  ): Promise<AnalysisResult> {
    
    // 1. Upload files
    if (onProgress) onProgress('Uploading CAN log', 10);
    if (!logFile.raw) throw new Error("Log file has no raw content to upload.");
    try {
      const logPath = await ApiClient.uploadFile(logFile.raw);
      
      if (onProgress) onProgress('Uploading DBC file', 20);
      if (!dbcFile.raw) throw new Error("DBC file has no raw content to upload.");
      const dbcPath = await ApiClient.uploadFile(dbcFile.raw);
      
      // 2. Start analysis
      if (onProgress) onProgress('Starting analysis', 30);
      const startResponse = await ApiClient.startAnalysis({
        filepath: logPath,
        dbc_path: dbcPath,
        mode: 'hybrid',
        onnx_model_path: 'models/can_net.onnx',
        scaler_config_path: '../data/scaler_config.json'
      });
    
    const jobId = startResponse.job_id;
    
    // 3. Poll for completion
    let isComplete = false;
    let attempts = 0;
    while (!isComplete) {
      // 1-second delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
      
      const statusResponse = await ApiClient.getJobStatus(jobId);
      
      if (statusResponse.status === 'failed') {
        throw new Error(`Analysis failed: ${statusResponse.error || 'Unknown error'}`);
      }
      
      if (statusResponse.status === 'complete') {
        isComplete = true;
      } else {
        if (onProgress) {
          onProgress(`Backend status: ${statusResponse.status}`, Math.min(90, 30 + attempts * 5));
        }
      }
      
      // timeout after ~60s
      if (attempts > 60) {
        throw new Error("Analysis timed out.");
      }
    }
    
    // 4. Fetch results
    if (onProgress) onProgress('Fetching results', 95);
    const results = await ApiClient.getJobResults(jobId);
    
    // 5. Map results to frontend types
    const mappedIncidents: Incident[] = results.incidents.map((apiInc, index) => {
      // Find supporting frames for this incident
      // We extract all frame-level alerts that fall within this incident's time window
      // (Using a small tolerance just in case, but strict timestamp logic should work since backend generated them)
      const frames: FrameEvidence[] = results.anomalies
        .filter(alert => alert.timestamp >= apiInc.start_time - 0.001 && alert.timestamp <= apiInc.end_time + 0.001)
        .map(alert => ({
          timestamp: alert.timestamp,
          canId: alert.can_id !== undefined ? `0x${alert.can_id.toString(16).toUpperCase().padStart(3, '0')}` : 'Unknown',
          value: alert.dl_score,
          rawPayload: alert.description
        }));

      return {
        id: `inc-${index + 1}`,
        anomalyType: apiInc.primary_anomaly_type,
        severity: apiInc.severity as any,
        startTime: apiInc.start_time,
        endTime: apiInc.end_time,
        duration: apiInc.duration,
        canIds: apiInc.affected_can_ids.map(id => `0x${id.toString(16).toUpperCase().padStart(3, '0')}`),
        occurrences: apiInc.occurrences,
        dlScore: apiInc.peak_dl_score,
        ruleEvidence: apiInc.all_rule_evidence.join(', '),
        frames: frames
      };
    });

    return {
      summary: {
        framesProcessed: results.total_frames,
        decodedMessages: results.decoded_frames,
        incidents: results.incidents.length,
        precision: null, // Backend doesn't provide these natively yet for a random user file
        recall: null,
        f1: null,
        processingTime: results.execution_time,
        lastAnalysisDate: new Date().toISOString()
      },
      incidents: mappedIncidents
    };
    } catch (e) {
      console.error("[CAN SENTINEL] Error caught in analyze():", e);
      throw e;
    }
  }
}
