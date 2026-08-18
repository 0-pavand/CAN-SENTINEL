import torch
import numpy as np
import time
from typing import Dict, Any, Tuple
from app.ml.model import LightweightCanNet
from sklearn.metrics import precision_recall_fscore_support, accuracy_score, confusion_matrix

class ModelEvaluator:
    def __init__(self, model_path: str, num_features: int, sequence_length: int = 16):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = LightweightCanNet(num_features, sequence_length).to(self.device)
        self.model.load_state_dict(torch.load(model_path, map_location=self.device, weights_only=True))
        self.model.eval()
        
    def evaluate(self, X_test: np.ndarray, y_test: np.ndarray, threshold: float = 0.5) -> Dict[str, Any]:
        """
        Evaluate the model on a pre-normalized test dataset.
        """
        if len(X_test) == 0:
            return {}
            
        X_tensor = torch.FloatTensor(X_test).to(self.device)
        
        # Measure inference latency
        start_time = time.perf_counter()
        with torch.no_grad():
            logits = self.model(X_tensor).squeeze(-1)
            probs = torch.sigmoid(logits).cpu().numpy()
        end_time = time.perf_counter()
        
        avg_latency_ms = ((end_time - start_time) / len(X_test)) * 1000
        
        preds = (probs >= threshold).astype(int)
        
        precision, recall, f1, _ = precision_recall_fscore_support(y_test, preds, average="binary", zero_division=0)
        accuracy = accuracy_score(y_test, preds)
        
        cm = confusion_matrix(y_test, preds, labels=[0, 1])
        if cm.shape == (2, 2):
            tn, fp, fn, tp = cm.ravel()
        else:
            tn, fp, fn, tp = 0, 0, 0, 0
            
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
        
        return {
            "accuracy": float(accuracy),
            "precision": float(precision),
            "recall": float(recall),
            "f1": float(f1),
            "false_positive_rate": float(fpr),
            "true_positives": int(tp),
            "false_positives": int(fp),
            "false_negatives": int(fn),
            "true_negatives": int(tn),
            "avg_latency_ms": float(avg_latency_ms),
            "parameter_count": self.model.count_parameters()
        }
