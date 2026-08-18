import pytest
from app.detectors.rule_based import (
    BoundsDetector,
    FloodDetector,
    LogicalContradictionDetector,
    CorruptionDetector,
    TimeoutDetector
)
from app.storage.state_tracker import StateTracker

def test_bounds_detector():
    detector = BoundsDetector()
    features = {
        "timestamp": 1.0,
        "can_id": 201,
        "Engine_RPM_dist_from_range": 5000.0
    }
    alerts = detector.evaluate(features)
    assert len(alerts) == 1
    assert alerts[0].anomaly_type == "Out-of-Range"
    assert "Engine_RPM" in alerts[0].description

def test_flood_detector():
    detector = FloodDetector(deviation_threshold=0.005)
    features = {
        "timestamp": 1.0,
        "can_id": 416,
        "delta_time": 0.001,
        "timing_deviation": 0.009,
        "burst_rate": 1000.0
    }
    alerts = detector.evaluate(features)
    assert len(alerts) == 1
    assert alerts[0].anomaly_type == "Timing Flood"
    
def test_logical_contradiction():
    detector = LogicalContradictionDetector()
    features = {
        "timestamp": 1.0,
        "can_id": 416,
        "speed_engine_conflict": 1,
        "speed_gear_conflict": 0
    }
    alerts = detector.evaluate(features)
    assert len(alerts) == 1
    assert alerts[0].anomaly_type == "Logical Contradiction"
    assert "Engine is OFF" in alerts[0].description

def test_timeout_detector():
    detector = TimeoutDetector(timeout_multiplier=3.0)
    state = StateTracker()
    state.update_timestamp(432, 1.0) # Last seen at 1.0, expected cycle 0.01
    
    # Check at 1.01 (10ms elapsed), no timeout
    features = {"timestamp": 1.01, "can_id": 416}
    alerts = detector.evaluate(features, state)
    assert len(alerts) == 0
    
    # Check at 1.05 (50ms elapsed, 5x expected cycle)
    features = {"timestamp": 1.05, "can_id": 416}
    alerts = detector.evaluate(features, state)
    assert len(alerts) == 1
    assert alerts[0].anomaly_type == "Missing Timeout"
    assert alerts[0].can_id == 432
    
def test_corruption_detector():
    detector = CorruptionDetector()
    features = {
        "timestamp": 1.0,
        "can_id": 201,
        "dlc_match": 0
    }
    alerts = detector.evaluate(features)
    assert len(alerts) == 1
    assert alerts[0].anomaly_type == "Data Corruption"
    assert "DLC mismatch" in alerts[0].description
