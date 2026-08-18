from typing import Dict, Any, List, Optional
from app.detectors.base import DetectorInterface
from app.models.can_frame import AnomalyAlert
from app.storage.state_tracker import StateTracker

class BoundsDetector(DetectorInterface):
    """A1: Out of range"""
    def evaluate(self, features: Dict[str, Any], state: Optional[StateTracker] = None) -> List[AnomalyAlert]:
        alerts = []
        for key, val in features.items():
            if key.endswith("_dist_from_range") and val > 0:
                signal_name = key.replace("_dist_from_range", "")
                alerts.append(AnomalyAlert(
                    timestamp=features["timestamp"],
                    can_id=features.get("can_id"),
                    anomaly_type="Out-of-Range",
                    severity="CRITICAL",
                    description=f"{signal_name} is out of bounds (distance: {val})",
                    evidence={"distance": val},
                    confidence=1.0
                ))
        return alerts

class FloodDetector(DetectorInterface):
    """A2: Timing Flood"""
    def __init__(self, deviation_threshold: float = 0.005): # 5ms
        self.threshold = deviation_threshold
        
    def evaluate(self, features: Dict[str, Any], state: Optional[StateTracker] = None) -> List[AnomalyAlert]:
        alerts = []
        dev = features.get("timing_deviation", 0)
        dt = features.get("delta_time", 0)
        burst = features.get("burst_rate", 0)
        
        if burst > 0 and dev > self.threshold:
            if dt > 0 and dt < 0.005: # less than 5ms
                alerts.append(AnomalyAlert(
                    timestamp=features["timestamp"],
                    can_id=features.get("can_id"),
                    anomaly_type="Timing Flood",
                    severity="HIGH",
                    description=f"Message arriving too fast (dt={dt:.4f}s)",
                    evidence={"timing_deviation": dev, "burst_rate": burst},
                    confidence=0.9
                ))
        return alerts

class LogicalContradictionDetector(DetectorInterface):
    """A3: Cross signal logic"""
    def evaluate(self, features: Dict[str, Any], state: Optional[StateTracker] = None) -> List[AnomalyAlert]:
        alerts = []
        if features.get("speed_engine_conflict") == 1:
            alerts.append(AnomalyAlert(
                timestamp=features["timestamp"],
                can_id=features.get("can_id"),
                anomaly_type="Logical Contradiction",
                severity="CRITICAL",
                description="Vehicle Speed > 0 while Engine is OFF",
                evidence={"speed_engine_conflict": 1},
                confidence=1.0
            ))
        if features.get("speed_gear_conflict") == 1:
            alerts.append(AnomalyAlert(
                timestamp=features["timestamp"],
                can_id=features.get("can_id"),
                anomaly_type="Logical Contradiction",
                severity="CRITICAL",
                description="Vehicle Speed > 0 while Gear is PARK",
                evidence={"speed_gear_conflict": 1},
                confidence=1.0
            ))
        return alerts

class TimeoutDetector(DetectorInterface):
    """A4: Missing cyclic messages"""
    def __init__(self, timeout_multiplier: float = 3.0):
        self.timeout_multiplier = timeout_multiplier
        # We need to track which alerts we've fired so we don't spam them every frame
        self.fired_timeouts: Dict[int, float] = {}
        
    def evaluate(self, features: Dict[str, Any], state: Optional[StateTracker] = None) -> List[AnomalyAlert]:
        alerts = []
        if not state:
            return alerts
            
        current_ts = features["timestamp"]
        
        for can_id, last_seen in state.last_seen_timestamps.items():
            expected = state.get_expected_cycle(can_id)
            if expected > 0:
                elapsed = current_ts - last_seen
                if elapsed > (expected * self.timeout_multiplier):
                    # Only fire if we haven't already fired for this specific timeout event
                    # (e.g. if we fired less than expected_cycle ago)
                    last_fired = self.fired_timeouts.get(can_id)
                    if last_fired is None or (current_ts - last_fired) > expected:
                        alerts.append(AnomalyAlert(
                            timestamp=current_ts,
                            can_id=can_id,
                            anomaly_type="Missing Timeout",
                            severity="CRITICAL",
                            description=f"Message 0x{can_id:03X} timed out (elapsed {elapsed:.4f}s > {expected * self.timeout_multiplier:.4f}s)",
                            evidence={"elapsed": elapsed, "expected": expected, "multiplier": self.timeout_multiplier},
                            confidence=0.95
                        ))
                        self.fired_timeouts[can_id] = current_ts
                        
        return alerts

class CorruptionDetector(DetectorInterface):
    """A5: Data corruption"""
    def evaluate(self, features: Dict[str, Any], state: Optional[StateTracker] = None) -> List[AnomalyAlert]:
        alerts = []
        evidence = {}
        msg = []
        if features.get("all_ff") == 1:
            msg.append("All 0xFF payload")
            evidence["all_ff"] = 1
        if features.get("all_zero") == 1:
            msg.append("All 0x00 payload")
            evidence["all_zero"] = 1
        if features.get("aa_55_pattern") == 1:
            msg.append("AA/55 test pattern")
            evidence["aa_55"] = 1
        if features.get("dlc_match") == 0:
            msg.append("DLC mismatch")
            evidence["dlc_match"] = 0
            
        if msg:
            alerts.append(AnomalyAlert(
                timestamp=features["timestamp"],
                can_id=features.get("can_id"),
                anomaly_type="Data Corruption",
                severity="CRITICAL",
                description=", ".join(msg),
                evidence=evidence,
                confidence=1.0
            ))
        return alerts
