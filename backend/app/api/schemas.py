from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from enum import Enum

class SystemHealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"
    mode: str = "offline"
    models: Dict[str, str] = Field(default_factory=dict, description="Model statuses")

class AnalysisMode(str, Enum):
    RULES = "rules"
    DL = "dl"
    HYBRID = "hybrid"

class AnalysisStartRequest(BaseModel):
    filepath: str
    dbc_path: str
    mode: AnalysisMode = AnalysisMode.HYBRID
    onnx_model_path: Optional[str] = "models/can_net.onnx"
    scaler_config_path: Optional[str] = "data/scaler_config.json"

class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETE = "complete"
    FAILED = "failed"

class JobStatusResponse(BaseModel):
    job_id: str
    status: JobStatus
    progress: float = 0.0
    error: Optional[str] = None
    created_at: float
    updated_at: float

class ApiAnomalyAlert(BaseModel):
    timestamp: float
    can_id: Optional[int]
    anomaly_type: str
    severity: str
    description: str
    is_rule_violation: bool = False
    dl_score: Optional[float] = None
    rule_evidence: Optional[List[str]] = None

class ApiAnomalyIncident(BaseModel):
    start_time: float
    end_time: float
    duration: float
    primary_anomaly_type: str
    severity: str
    description: str
    affected_can_ids: List[int]
    occurrences: int
    peak_dl_score: Optional[float] = None
    all_rule_evidence: List[str] = []

class AnalysisResultResponse(BaseModel):
    job_id: str
    status: JobStatus
    total_frames: int = 0
    decoded_frames: int = 0
    unique_can_ids: int = 0
    anomalies: List[ApiAnomalyAlert] = []
    incidents: List[ApiAnomalyIncident] = []
    error: Optional[str] = None
    execution_time: float = 0.0
