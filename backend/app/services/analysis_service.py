import uuid
import time
import asyncio
from typing import Dict, Any, Optional

from app.api.schemas import JobStatus, JobStatusResponse, AnalysisResultResponse, ApiAnomalyAlert, AnalysisMode
from app.parsers.asc_parser import ASCParser
from app.dbc.decoder import DbcDecoder
from app.core.errors import DbcDecodingError
from app.features.pipeline import FeaturePipeline
from app.detectors.engine import DetectionEngine
from app.ml.inference import OnnxPredictor
from app.detectors.hybrid import HybridDetectionEngine

class AnalysisService:
    def __init__(self):
        # In-memory store for job state and results (for a production app, use Redis/DB)
        self.jobs: Dict[str, JobStatusResponse] = {}
        self.results: Dict[str, AnalysisResultResponse] = {}

    def get_job_status(self, job_id: str) -> Optional[JobStatusResponse]:
        return self.jobs.get(job_id)

    def get_job_results(self, job_id: str) -> Optional[AnalysisResultResponse]:
        return self.results.get(job_id)

    async def start_analysis(self, request_data: dict) -> str:
        job_id = str(uuid.uuid4())
        now = time.time()
        
        self.jobs[job_id] = JobStatusResponse(
            job_id=job_id,
            status=JobStatus.PENDING,
            created_at=now,
            updated_at=now
        )
        
        # Start the background task
        asyncio.create_task(self._run_analysis(job_id, request_data))
        
        return job_id

    async def _run_analysis(self, job_id: str, request_data: dict):
        self.jobs[job_id].status = JobStatus.RUNNING
        self.jobs[job_id].updated_at = time.time()
        start_time = time.time()
        
        try:
            filepath = request_data["filepath"]
            dbc_path = request_data["dbc_path"]
            mode = request_data["mode"]
            
            parser_log = ASCParser()
            decoder = DbcDecoder(dbc_path)
            
            # Setup pipelines based on mode
            rule_engine = None
            dl_predictor = None
            feature_pipeline = None
            hybrid_engine = None
            
            if mode in [AnalysisMode.RULES, AnalysisMode.HYBRID]:
                rule_engine = DetectionEngine(dbc_path)
                
            if mode in [AnalysisMode.DL, AnalysisMode.HYBRID]:
                dl_predictor = OnnxPredictor(
                    request_data.get("onnx_model_path", "models/can_net.onnx"),
                    request_data.get("scaler_config_path", "data/scaler_config.json")
                )
                feature_pipeline = FeaturePipeline()
                
            if mode == AnalysisMode.HYBRID:
                hybrid_engine = HybridDetectionEngine(
                    rule_engine=DetectionEngine(dbc_path),
                    dl_predictor=dl_predictor,
                    feature_pipeline=FeaturePipeline(),
                    sequence_length=16
                )
                
            events = []
            frame_count = 0
            decoded_count = 0
            unique_ids = set()
            
            # For progress tracking, we could get file size, but ASC files are hard to estimate.
            # We'll just update progress artificially based on lines parsed if we wanted, 
            # but for now we just parse.
            for frame in parser_log.parse(filepath):
                frame_count += 1
                unique_ids.add(frame.arbitration_id)
                if frame_count % 1000 == 0:
                    # Give control back to event loop occasionally
                    await asyncio.sleep(0.001)
                    
                try:
                    decoded = decoder.decode(frame)
                    decoded_count += 1
                except DbcDecodingError:
                    decoded = None
                    
                if mode == AnalysisMode.RULES:
                    r_ev = rule_engine.process(frame)
                    for rev in r_ev:
                        events.append(ApiAnomalyAlert(
                            timestamp=rev.timestamp,
                            can_id=rev.can_id,
                            anomaly_type="Rules Only",
                            severity=rev.severity,
                            description=rev.description,
                            is_rule_violation=True
                        ))
                elif mode == AnalysisMode.DL:
                    feats = feature_pipeline.process(frame, decoded)
                    dl_ev = dl_predictor.predict(feats)
                    if dl_ev:
                        events.append(ApiAnomalyAlert(
                            timestamp=dl_ev.timestamp,
                            can_id=dl_ev.can_id,
                            anomaly_type="DL Only",
                            severity=dl_ev.severity,
                            description=dl_ev.description,
                            dl_score=dl_ev.score
                        ))
                elif mode == AnalysisMode.HYBRID:
                    h_ev = hybrid_engine.process_frame(frame, decoded)
                    if h_ev:
                        events.append(ApiAnomalyAlert(
                            timestamp=h_ev.timestamp,
                            can_id=h_ev.can_id,
                            anomaly_type="Hybrid",
                            severity=h_ev.severity,
                            description=h_ev.description,
                            is_rule_violation=len(h_ev.rule_evidence) > 0,
                            dl_score=h_ev.dl_score,
                            rule_evidence=h_ev.rule_evidence
                        ))
            
            execution_time = time.time() - start_time
            
            # Aggregate incidents
            from app.detectors.aggregator import IncidentAggregator
            aggregator = IncidentAggregator(time_window=1.0)
            incidents = aggregator.aggregate(events)
            
            self.results[job_id] = AnalysisResultResponse(
                job_id=job_id,
                status=JobStatus.COMPLETE,
                total_frames=frame_count,
                decoded_frames=decoded_count,
                unique_can_ids=len(unique_ids),
                anomalies=events,
                incidents=incidents,
                execution_time=execution_time
            )
            
            self.jobs[job_id].status = JobStatus.COMPLETE
            self.jobs[job_id].progress = 100.0
            self.jobs[job_id].updated_at = time.time()
            
        except Exception as e:
            self.jobs[job_id].status = JobStatus.FAILED
            self.jobs[job_id].error = str(e)
            self.jobs[job_id].updated_at = time.time()
            
            self.results[job_id] = AnalysisResultResponse(
                job_id=job_id,
                status=JobStatus.FAILED,
                error=str(e)
            )

# Singleton instance
analysis_service = AnalysisService()
