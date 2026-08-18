import pytest
import numpy as np
from app.ml.dataset_prep import DatasetGenerator
from app.evaluation.ground_truth import GroundTruthEvent
from app.ml.utils import split_dataset_sequentially

def test_dataset_generator():
    generator = DatasetGenerator(sequence_length=4, stride=2)
    
    raw_features = [
        {"can_id": 201, "timestamp": 1.0, "feat_1": 10},
        {"can_id": 201, "timestamp": 1.1, "feat_1": 12},
        {"can_id": 201, "timestamp": 1.2, "feat_1": 15},
        {"can_id": 201, "timestamp": 1.3, "feat_1": 20},
        {"can_id": 201, "timestamp": 1.4, "feat_1": 25},
        {"can_id": 201, "timestamp": 1.5, "feat_1": 30}
    ]
    
    gt = [
        GroundTruthEvent(
            anomaly_id="A1",
            anomaly_type="Test",
            start_time=1.2,
            end_time=1.3,
            affected_can_ids=[201],
            affected_signals=[],
            severity="",
            description="",
            source_reference="",
            expected_detection_mechanism=""
        )
    ]
    
    X_seq, y_seq = generator.generate(raw_features, gt)
    
    # 6 frames, seq=4, stride=2 -> (6-4)/2 + 1 = 2 sequences
    # Seq 0: frames 0, 1, 2, 3 -> frame 2 and 3 are anomalies -> y=1
    # Seq 1: frames 2, 3, 4, 5 -> frame 2 and 3 are anomalies -> y=1
    
    assert X_seq.shape == (2, 4, 2) # can_id and feat_1 are features, timestamp removed
    assert y_seq.shape == (2,)
    assert y_seq[0] == 1
    assert y_seq[1] == 1
    
    assert len(generator.feature_columns) == 2
    assert "can_id" in generator.feature_columns
    assert "feat_1" in generator.feature_columns

def test_sequential_split():
    X = np.zeros((100, 4, 2))
    y = np.zeros(100)
    
    X_tr, y_tr, X_val, y_val, X_te, y_te = split_dataset_sequentially(X, y, train_ratio=0.7, val_ratio=0.15)
    
    assert len(X_tr) == 70
    assert len(X_val) == 15
    assert len(X_te) == 15
