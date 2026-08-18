from typing import List
from app.models.can_frame import RawCanFrame, AnomalyAlert
from app.features.pipeline import FeaturePipeline
from app.detectors.rule_based import (
    BoundsDetector,
    FloodDetector,
    LogicalContradictionDetector,
    TimeoutDetector,
    CorruptionDetector
)
from app.dbc.decoder import DbcDecoder
from app.core.errors import DbcDecodingError

class DetectionEngine:
    def __init__(self, dbc_path: str):
        self.decoder = DbcDecoder(dbc_path)
        self.pipeline = FeaturePipeline()
        
        # Initialize all baseline deterministic detectors
        self.detectors = [
            BoundsDetector(),
            FloodDetector(deviation_threshold=0.005),
            LogicalContradictionDetector(),
            TimeoutDetector(timeout_multiplier=3.0),
            CorruptionDetector()
        ]
        
    def process(self, frame: RawCanFrame) -> List[AnomalyAlert]:
        """
        Process a single raw frame through decoding, feature extraction, and detection.
        Returns a list of AnomalyAlerts generated for this frame and its global state.
        """
        decoded = None
        try:
            decoded = self.decoder.decode(frame)
        except DbcDecodingError:
            pass # Malformed frames still pass through to feature extraction for A5 detection
            
        features = self.pipeline.process(frame, decoded)
        
        alerts = []
        for detector in self.detectors:
            triggered = detector.evaluate(features, self.pipeline.state)
            if triggered:
                alerts.extend(triggered)
                
        return alerts
