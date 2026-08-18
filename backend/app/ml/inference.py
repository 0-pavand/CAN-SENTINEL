import torch
import json
import numpy as np
from typing import Dict, Any, List
from app.ml.model import LightweightCanNet

class ModelPredictor:
    def __init__(self, model_path: str, config_path: str, sequence_length: int = 16):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        with open(config_path, 'r') as f:
            config = json.load(f)
            self.feature_columns = config["features"]
            self.means = config["means"]
            self.stds = config["stds"]
            
        num_features = len(self.feature_columns)
        self.model = LightweightCanNet(num_features, sequence_length).to(self.device)
        self.model.load_state_dict(torch.load(model_path, map_location=self.device, weights_only=True))
        self.model.eval()
        
    def preprocess_sequence(self, raw_sequence: List[Dict[str, Any]]) -> torch.Tensor:
        """
        Takes a sequence of raw feature dictionaries and converts to a normalized tensor.
        """
        X = []
        for row in raw_sequence:
            vec = []
            for col in self.feature_columns:
                val = row.get(col, 0.0)
                if val is None or isinstance(val, str):
                    val = 0.0
                if val == float('inf'):
                    val = 1e6
                # Normalize
                mean = self.means[col]
                std = self.stds[col]
                if std == 0:
                    std = 1.0
                norm_val = (float(val) - mean) / std
                vec.append(norm_val)
            X.append(vec)
            
        # Shape: (1, seq_length, num_features)
        X_tensor = torch.FloatTensor([X]).to(self.device)
        return X_tensor
        
    def predict(self, raw_sequence: List[Dict[str, Any]]) -> float:
        """
        Returns anomaly probability [0, 1].
        """
        with torch.no_grad():
            X_tensor = self.preprocess_sequence(raw_sequence)
            logits = self.model(X_tensor).squeeze(-1)
            prob = torch.sigmoid(logits).item()
        return prob

class OnnxPredictor:
    def __init__(self, model_path: str, config_path: str):
        import onnxruntime as ort
        
        with open(config_path, 'r') as f:
            config = json.load(f)
            self.feature_columns = config["features"]
            self.means = config["means"]
            self.stds = config["stds"]
            
        self.session = ort.InferenceSession(model_path)
        self.input_name = self.session.get_inputs()[0].name
        
    def preprocess_sequence(self, raw_sequence: List[Dict[str, Any]]) -> np.ndarray:
        X = []
        for row in raw_sequence:
            vec = []
            for col in self.feature_columns:
                val = row.get(col, 0.0)
                if val is None or isinstance(val, str):
                    val = 0.0
                if val == float('inf'):
                    val = 1e6
                mean = self.means[col]
                std = self.stds[col]
                if std == 0:
                    std = 1.0
                norm_val = (float(val) - mean) / std
                vec.append(norm_val)
            X.append(vec)
            
        return np.array([X], dtype=np.float32)
        
    def predict(self, raw_sequence: List[Dict[str, Any]]) -> float:
        X_arr = self.preprocess_sequence(raw_sequence)
        
        logits = self.session.run(None, {self.input_name: X_arr})[0]
        # Apply sigmoid
        logit = logits[0][0]
        prob = 1 / (1 + np.exp(-logit))
        return prob
