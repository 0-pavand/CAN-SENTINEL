from typing import List, Dict, Any
from app.models.can_frame import AnomalyAlert
from app.evaluation.ground_truth import GroundTruthEvent

class EvaluationMetrics:
    def __init__(self, true_positives: int, false_positives: int, false_negatives: int, latency_list: List[float]):
        self.true_positives = true_positives
        self.false_positives = false_positives
        self.false_negatives = false_negatives
        self.latency_list = latency_list

    @property
    def precision(self) -> float:
        if self.true_positives + self.false_positives == 0:
            return 0.0
        return self.true_positives / (self.true_positives + self.false_positives)

    @property
    def recall(self) -> float:
        if self.true_positives + self.false_negatives == 0:
            return 0.0
        return self.true_positives / (self.true_positives + self.false_negatives)

    @property
    def f1_score(self) -> float:
        p = self.precision
        r = self.recall
        if p + r == 0:
            return 0.0
        return 2 * (p * r) / (p + r)

    @property
    def avg_latency(self) -> float:
        if not self.latency_list:
            return 0.0
        return sum(self.latency_list) / len(self.latency_list)

class Evaluator:
    def __init__(self, ground_truth: List[GroundTruthEvent], time_tolerance: float = 0.05):
        """
        :param ground_truth: List of expected anomaly events.
        :param time_tolerance: Acceptable latency tolerance (seconds) for an alert to be considered a match.
        """
        self.ground_truth = ground_truth
        self.time_tolerance = time_tolerance

    def evaluate(self, predictions: List[AnomalyAlert]) -> Dict[str, Any]:
        """
        Evaluates the list of AnomalyAlert predictions against the ground truth events.
        """
        matched_gt = set()
        matched_preds = set()
        latency_list = []
        
        per_anomaly_metrics = {}
        
        # 1. Match Predictions to Ground Truth Events
        for pred_idx, pred in enumerate(predictions):
            for gt_idx, gt in enumerate(self.ground_truth):
                if gt_idx in matched_gt:
                    continue # Already detected
                    
                # Event match window: [start, end + tolerance]
                if gt.start_time <= pred.timestamp <= (gt.end_time + self.time_tolerance):
                    # Check if CAN ID matches (if specified in pred)
                    if getattr(pred, 'can_id', None) is None or getattr(pred, 'can_id', None) in gt.affected_can_ids:
                        matched_gt.add(gt_idx)
                        matched_preds.add(pred_idx)
                        
                        latency = max(0.0, pred.timestamp - gt.start_time)
                        latency_list.append(latency)
                        
                        per_anomaly_metrics[gt.anomaly_id] = {
                            "detected": True,
                            "latency": latency
                        }
                        break
        
        # 2. Compute Metrics
        tp = len(matched_gt)
        fn = len(self.ground_truth) - tp
        fp = len(predictions) - len(matched_preds)
        
        # Populate missed anomalies
        for gt_idx, gt in enumerate(self.ground_truth):
            if gt_idx not in matched_gt:
                per_anomaly_metrics[gt.anomaly_id] = {
                    "detected": False,
                    "latency": None
                }
                
        metrics = EvaluationMetrics(tp, fp, fn, latency_list)
        
        return {
            "overall": {
                "precision": metrics.precision,
                "recall": metrics.recall,
                "f1": metrics.f1_score,
                "true_positives": metrics.true_positives,
                "false_positives": metrics.false_positives,
                "false_negatives": metrics.false_negatives,
                "avg_latency": metrics.avg_latency
            },
            "per_anomaly": per_anomaly_metrics
        }

    def evaluate_incidents(self, predicted_incidents: List[Any]) -> Dict[str, Any]:
        """
        Evaluates aggregated incidents against ground truth events.
        """
        matched_gt = set()
        matched_preds = set()
        latency_list = []
        
        per_anomaly_metrics = {}
        
        for pred_idx, inc in enumerate(predicted_incidents):
            for gt_idx, gt in enumerate(self.ground_truth):
                if gt_idx in matched_gt:
                    continue
                    
                # Check for overlap between incident [start_time, end_time] and gt [start, end]
                if not (inc.end_time < gt.start_time or inc.start_time > (gt.end_time + self.time_tolerance)):
                    # Check CAN IDs overlap
                    if not inc.affected_can_ids or any(cid in gt.affected_can_ids for cid in inc.affected_can_ids):
                        matched_gt.add(gt_idx)
                        matched_preds.add(pred_idx)
                        
                        latency = max(0.0, inc.start_time - gt.start_time)
                        latency_list.append(latency)
                        
                        per_anomaly_metrics[gt.anomaly_id] = {
                            "detected": True,
                            "latency": latency
                        }
                        break
        
        tp = len(matched_gt)
        fn = len(self.ground_truth) - tp
        fp = len(predicted_incidents) - len(matched_preds)
        
        for gt_idx, gt in enumerate(self.ground_truth):
            if gt_idx not in matched_gt:
                per_anomaly_metrics[gt.anomaly_id] = {
                    "detected": False,
                    "latency": None
                }
                
        metrics = EvaluationMetrics(tp, fp, fn, latency_list)
        
        return {
            "overall": {
                "precision": metrics.precision,
                "recall": metrics.recall,
                "f1": metrics.f1_score,
                "true_positives": metrics.true_positives,
                "false_positives": metrics.false_positives,
                "false_negatives": metrics.false_negatives,
                "avg_latency": metrics.avg_latency
            },
            "per_anomaly": per_anomaly_metrics
        }
