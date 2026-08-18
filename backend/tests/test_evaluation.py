import pytest
from app.evaluation.ground_truth import GroundTruthEvent
from app.evaluation.metrics import Evaluator
from app.models.can_frame import AnomalyAlert

@pytest.fixture
def mock_ground_truth():
    return [
        GroundTruthEvent(
            anomaly_id="A1",
            anomaly_type="Out-of-Range",
            start_time=1.0,
            end_time=1.0,
            affected_can_ids=[201],
            affected_signals=[],
            severity="HIGH",
            description="Test A1",
            source_reference="",
            expected_detection_mechanism=""
        ),
        GroundTruthEvent(
            anomaly_id="A4",
            anomaly_type="Timeout",
            start_time=5.0,
            end_time=15.0,
            affected_can_ids=[432],
            affected_signals=[],
            severity="HIGH",
            description="Test A4",
            source_reference="",
            expected_detection_mechanism=""
        )
    ]

def test_perfect_evaluation(mock_ground_truth):
    evaluator = Evaluator(mock_ground_truth, time_tolerance=0.1)
    
    predictions = [
        AnomalyAlert(timestamp=1.05, can_id=201, anomaly_type="OOB", description="Found A1"),
        AnomalyAlert(timestamp=6.0, can_id=432, anomaly_type="Timeout", description="Found A4")
    ]
    
    results = evaluator.evaluate(predictions)
    
    assert results["overall"]["precision"] == 1.0
    assert results["overall"]["recall"] == 1.0
    assert results["overall"]["f1"] == 1.0
    assert results["overall"]["true_positives"] == 2
    assert results["overall"]["false_positives"] == 0
    assert results["overall"]["false_negatives"] == 0
    
    assert results["per_anomaly"]["A1"]["detected"] is True
    assert pytest.approx(results["per_anomaly"]["A1"]["latency"]) == 0.05
    
    assert results["per_anomaly"]["A4"]["detected"] is True
    assert pytest.approx(results["per_anomaly"]["A4"]["latency"]) == 1.0

def test_missed_anomalies(mock_ground_truth):
    evaluator = Evaluator(mock_ground_truth, time_tolerance=0.1)
    
    # Missing A4, getting A1
    predictions = [
        AnomalyAlert(timestamp=1.0, can_id=201, anomaly_type="OOB", description="Found A1")
    ]
    
    results = evaluator.evaluate(predictions)
    
    assert results["overall"]["precision"] == 1.0
    assert results["overall"]["recall"] == 0.5
    assert results["overall"]["false_negatives"] == 1
    assert results["per_anomaly"]["A4"]["detected"] is False

def test_false_positives(mock_ground_truth):
    evaluator = Evaluator(mock_ground_truth, time_tolerance=0.1)
    
    predictions = [
        AnomalyAlert(timestamp=1.0, can_id=201, anomaly_type="OOB", description="Found A1"),
        AnomalyAlert(timestamp=20.0, can_id=111, anomaly_type="Fake", description="False Alarm")
    ]
    
    results = evaluator.evaluate(predictions)
    
    assert results["overall"]["precision"] == 0.5
    assert results["overall"]["recall"] == 0.5
    assert results["overall"]["false_positives"] == 1
