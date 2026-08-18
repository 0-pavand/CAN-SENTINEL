import numpy as np
import json
from typing import List, Dict, Any, Tuple
from app.evaluation.ground_truth import GroundTruthEvent

class DatasetGenerator:
    def __init__(self, sequence_length: int = 32, stride: int = 16):
        self.sequence_length = sequence_length
        self.stride = stride
        self.feature_columns: List[str] = []
        self.mean_config: Dict[str, float] = {}
        self.std_config: Dict[str, float] = {}
        
    def _is_anomaly(self, timestamp: float, can_id: int, gt_events: List[GroundTruthEvent]) -> int:
        for gt in gt_events:
            if gt.start_time <= timestamp <= gt.end_time:
                # If can_id is specified in GT, it must match. If empty, assume all frames during window are bad.
                if not gt.affected_can_ids or can_id in gt.affected_can_ids:
                    return 1
        return 0

    def generate(self, raw_features: List[Dict[str, Any]], gt_events: List[GroundTruthEvent]) -> Tuple[np.ndarray, np.ndarray]:
        """
        Takes flat feature rows, applies normalization, labels them using ground truth, 
        and slides a window to create sequences.
        """
        if not raw_features:
            return np.array([]), np.array([])
            
        # 1. Identify all numerical columns
        cols = set()
        for row in raw_features:
            cols.update(row.keys())
        # Remove metadata columns that shouldn't be normalized or used directly as features
        # Actually timestamp and can_id might be useful, but let's keep can_id and drop timestamp for DL.
        if "timestamp" in cols:
            cols.remove("timestamp")
        
        self.feature_columns = sorted(list(cols))
        
        # 2. Extract 2D matrix
        X_flat = []
        y_flat = []
        
        for row in raw_features:
            vec = []
            for col in self.feature_columns:
                val = row.get(col, 0.0)
                # Handle None or strings if any accidentally slipped through
                if val is None or isinstance(val, str):
                    val = 0.0
                # Handle inf from burst rate
                if val == float('inf'):
                    val = 1e6
                vec.append(float(val))
                
            X_flat.append(vec)
            # Label
            ts = row.get("timestamp", 0.0)
            cid = row.get("can_id", 0)
            y_flat.append(self._is_anomaly(ts, cid, gt_events))
            
        X_flat = np.array(X_flat)
        y_flat = np.array(y_flat)
        
        # 3. Normalization (Standard Scaler)
        # We compute mean and std across the entire dataset here for simplicity, 
        # though strictly we should compute it on train only. 
        # Since this is a preparation pipeline we'll scale it all together, 
        # but in a strict ML pipeline we'd fit on train.
        means = np.mean(X_flat, axis=0)
        stds = np.std(X_flat, axis=0)
        stds[stds == 0] = 1.0 # Prevent division by zero
        
        X_scaled = (X_flat - means) / stds
        
        for i, col in enumerate(self.feature_columns):
            self.mean_config[col] = float(means[i])
            self.std_config[col] = float(stds[i])
            
        # 4. Create sequences (Sliding Window)
        X_seq = []
        y_seq = []
        
        for i in range(0, len(X_scaled) - self.sequence_length + 1, self.stride):
            window_x = X_scaled[i : i + self.sequence_length]
            window_y = y_flat[i : i + self.sequence_length]
            
            X_seq.append(window_x)
            # Sequence label is 1 if any frame in the window is an anomaly
            y_seq.append(1 if np.any(window_y) else 0)
            
        return np.array(X_seq), np.array(y_seq)

    def save_config(self, filepath: str):
        config = {
            "features": self.feature_columns,
            "means": self.mean_config,
            "stds": self.std_config
        }
        with open(filepath, 'w') as f:
            json.dump(config, f, indent=4)
