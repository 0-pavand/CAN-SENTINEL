export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface UploadResponse {
  message: string;
  filepath: string;
}

export interface StartAnalysisRequest {
  filepath: string;
  dbc_path: string;
  mode?: string;
  onnx_model_path?: string;
  scaler_config_path?: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  progress: number;
  error?: string;
  created_at: number;
  updated_at: number;
}

export interface ApiAnomalyAlert {
  timestamp: number;
  can_id?: number;
  anomaly_type: string;
  severity: string;
  description: string;
  is_rule_violation: boolean;
  dl_score?: number;
  rule_evidence?: string[];
}

export interface ApiAnomalyIncident {
  start_time: number;
  end_time: number;
  duration: number;
  primary_anomaly_type: string;
  severity: string;
  description: string;
  affected_can_ids: number[];
  occurrences: number;
  peak_dl_score?: number;
  all_rule_evidence: string[];
}

export interface AnalysisResultResponse {
  job_id: string;
  status: string;
  total_frames: number;
  decoded_frames: number;
  unique_can_ids: number;
  anomalies: ApiAnomalyAlert[];
  incidents: ApiAnomalyIncident[];
  error?: string;
  execution_time: number;
}

export class ApiClient {
  static async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/api/analysis/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }
    
    const data: UploadResponse = await response.json();
    return data.filepath;
  }

  static async startAnalysis(request: StartAnalysisRequest): Promise<JobStatusResponse> {
    const response = await fetch(`${API_BASE_URL}/api/analysis/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to start analysis: ${response.statusText}`);
    }
    
    return await response.json();
  }

  static async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    const response = await fetch(`${API_BASE_URL}/api/analysis/job/${jobId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get job status: ${response.statusText}`);
    }
    
    return await response.json();
  }

  static async getJobResults(jobId: string): Promise<AnalysisResultResponse> {
    const response = await fetch(`${API_BASE_URL}/api/analysis/job/${jobId}/results`);
    
    if (!response.ok) {
      throw new Error(`Failed to get job results: ${response.statusText}`);
    }
    
    return await response.json();
  }
}
