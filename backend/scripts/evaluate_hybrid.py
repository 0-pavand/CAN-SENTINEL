import argparse
import json
from typing import List, Dict

from app.parsers.asc_parser import ASCParser
from app.dbc.decoder import DbcDecoder
from app.features.pipeline import FeaturePipeline
from app.detectors.engine import DetectionEngine
from app.ml.inference import OnnxPredictor
from app.detectors.hybrid import HybridDetectionEngine, HybridEvent
from app.evaluation.metrics import Evaluator

def evaluate_pipeline(name: str, events: List[HybridEvent], evaluator: Evaluator):
    print(f"\n=== {name} Evaluation ===")
    
    # We map HybridEvents to AnomalyEvents to reuse Evaluator logic
    from app.models.can_frame import AnomalyAlert
    mapped_events = []
    for he in events:
        mapped_events.append(AnomalyAlert(
            timestamp=he.timestamp,
            can_id=he.can_id,
            anomaly_type=name,
            severity=he.severity,
            description=he.description
        ))
        
    results = evaluator.evaluate(mapped_events)
    metrics_overall = results['overall']
    print(f"True Positives:  {metrics_overall['true_positives']}")
    print(f"False Positives: {metrics_overall['false_positives']}")
    print(f"False Negatives: {metrics_overall['false_negatives']}")
    print(f"Precision: {metrics_overall['precision']:.4f}")
    print(f"Recall:    {metrics_overall['recall']:.4f}")
    print(f"F1 Score:  {metrics_overall['f1']:.4f}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--dbc", required=True)
    parser.add_argument("--gt", required=True)
    parser.add_argument("--onnx", default="models/can_net.onnx")
    parser.add_argument("--config", default="../data/scaler_config.json")
    args = parser.parse_args()
    
    decoder = DbcDecoder(args.dbc)
    
    # Instantiate 3 independent pipelines to simulate side-by-side
    
    # Rules
    rule_engine = DetectionEngine(args.dbc)
    
    # DL
    dl_predictor = OnnxPredictor(args.onnx, args.config)
    dl_feature_pipeline = FeaturePipeline()
    
    # Hybrid
    hybrid_feature_pipeline = FeaturePipeline()
    hybrid_engine = HybridDetectionEngine(
        rule_engine=DetectionEngine(args.dbc), # Fresh instance
        dl_predictor=dl_predictor,
        feature_pipeline=hybrid_feature_pipeline,
        sequence_length=16
    )
    
    rule_events = []
    dl_events = []
    hybrid_events = []
    
    print("Streaming CAN.log through pipelines...")
    dl_buffer = []
    
    # Parse log
    parser_log = ASCParser()
    from app.core.errors import DbcDecodingError
    for frame in parser_log.parse(args.input):
        try:
            decoded = decoder.decode(frame)
        except DbcDecodingError:
            decoded = None
        
        # 1. Rules
        r_ev = rule_engine.process(frame)
        for rev in r_ev:
            rule_events.append(HybridEvent(rev.timestamp, rev.description, rev.can_id, None, [rev.description], 0.0, rev.severity, 1.0))
            
        # 2. DL
        feats = dl_feature_pipeline.process(frame, decoded)
        dl_buffer.append(feats)
        if len(dl_buffer) > 16:
            dl_buffer.pop(0)
        if len(dl_buffer) == 16:
            score = dl_predictor.predict(dl_buffer)
            if score >= 0.5:
                dl_events.append(HybridEvent(frame.timestamp, "DL Anomaly", frame.arbitration_id, None, [], score, "Medium", score))
                
        # 3. Hybrid
        h_ev = hybrid_engine.process_frame(frame, decoded)
        if h_ev is not None:
            hybrid_events.append(h_ev)
            
    from app.evaluation.ground_truth import load_ground_truth
    gt_events = load_ground_truth(args.gt)
    evaluator = Evaluator(gt_events)
    
    evaluate_pipeline("Rules Only", rule_events, evaluator)
    evaluate_pipeline("Deep Learning Only", dl_events, evaluator)
    evaluate_pipeline("Hybrid Fusion", hybrid_events, evaluator)
    
    # Sample Hybrid Evidence
    print("\n=== Sample Hybrid Fusion Events ===")
    for h_ev in hybrid_events[:5]:
        print(f"T={h_ev.timestamp:.3f} | Confidence: {h_ev.confidence:.2f} | {h_ev.description}")
        for ev in h_ev.rule_evidence:
            print(f"  -> {ev}")

if __name__ == "__main__":
    main()
