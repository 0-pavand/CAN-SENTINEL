import typing
from dataclasses import dataclass
from typing import List, Dict, Any, Optional

from app.models.can_frame import RawCanFrame
from app.dbc.decoder import DecodedCanMessage
from app.detectors.base import AnomalyAlert
from app.detectors.engine import DetectionEngine
from app.features.pipeline import FeaturePipeline

@dataclass
class HybridEvent:
    timestamp: float
    description: str
    can_id: Optional[int]
    signal_name: Optional[str]
    rule_evidence: List[str]
    dl_score: float
    severity: str
    confidence: float
    
class HybridDetectionEngine:
    def __init__(self, rule_engine: DetectionEngine, dl_predictor, feature_pipeline: FeaturePipeline, sequence_length: int = 16, dl_threshold: float = 0.5):
        self.rule_engine = rule_engine
        self.dl_predictor = dl_predictor
        self.feature_pipeline = feature_pipeline
        self.sequence_length = sequence_length
        self.dl_threshold = dl_threshold
        
        self.feature_buffer = []
        
    def process_frame(self, frame: RawCanFrame, decoded: Optional[DecodedCanMessage]) -> Optional[HybridEvent]:
        # 1. Rule-based evaluation
        rule_events = self.rule_engine.process(frame)
        
        # 2. Extract features for DL
        features = self.feature_pipeline.process(frame, decoded)
        self.feature_buffer.append(features)
        
        if len(self.feature_buffer) > self.sequence_length:
            self.feature_buffer.pop(0)
            
        hybrid_event = None
        dl_score = 0.0
        
        # 3. DL evaluation (if buffer full)
        if len(self.feature_buffer) == self.sequence_length:
            dl_score = self.dl_predictor.predict(self.feature_buffer)
            
        # 4. Fusion Logic
        has_rules = len(rule_events) > 0
        has_dl = dl_score >= self.dl_threshold
        
        if has_rules or has_dl:
            evidence = []
            max_severity = "Medium"
            primary_can_id = frame.arbitration_id
            primary_signal = None
            
            if has_rules:
                for ev in rule_events:
                    evidence.append(f"Rule [{ev.anomaly_type}]: {ev.description}")
                    if ev.severity == "Critical":
                        max_severity = "Critical"
                    elif ev.severity == "High" and max_severity != "Critical":
                        max_severity = "High"
                    if ev.can_id is not None:
                        primary_can_id = ev.can_id
                    # AnomalyAlert has no signal_name, we skip it
                    primary_signal = None
            
            if has_dl:
                evidence.append(f"Deep Learning: Anomalous temporal pattern detected (Score: {dl_score:.2f})")
                
            # Confidence logic:
            # If deterministic rule triggered, we are 100% confident, DL just adds context.
            # If ONLY DL triggered, confidence is equal to the DL score.
            confidence = 1.0 if has_rules else float(dl_score)
            
            desc = "Hybrid Anomaly Detected"
            if has_rules and has_dl:
                desc = "Critical anomaly with evidence from deterministic validation and DL."
            elif has_rules:
                desc = "Deterministic rule violation."
            else:
                desc = "Deep learning temporal anomaly."
                
            hybrid_event = HybridEvent(
                timestamp=frame.timestamp,
                description=desc,
                can_id=primary_can_id,
                signal_name=primary_signal,
                rule_evidence=evidence,
                dl_score=float(dl_score),
                severity=max_severity,
                confidence=confidence
            )
            
        return hybrid_event
