import pytest
import asyncio
import time
import os

from app.services.analysis_service import analysis_service
from app.api.schemas import AnalysisMode
from app.evaluation.ground_truth import load_ground_truth
from app.evaluation.metrics import Evaluator
from app.models.can_frame import AnomalyAlert

def test_full_pipeline_integration():
    log_path = "../data/CAN.log"
    dbc_path = "../data/CAN.dbc"
    gt_path = "../data/ground_truth.json"
    
    if not os.path.exists(log_path) or not os.path.exists(dbc_path) or not os.path.exists(gt_path):
        pytest.skip("Integration dataset not found.")
        
    request_data = {
        "filepath": log_path,
        "dbc_path": dbc_path,
        "mode": AnalysisMode.HYBRID,
        "onnx_model_path": "models/can_net.onnx",
        "scaler_config_path": "../data/scaler_config.json"
    }
    
    # 1. Run the service
    job_id = asyncio.run(analysis_service.start_analysis(request_data))
    
    while True:
        status = analysis_service.get_job_status(job_id)
        if status.status in ["complete", "failed"]:
            break
        time.sleep(0.1)
        
    assert status.status == "complete", f"Pipeline failed: {status.error}"
    
    results = analysis_service.get_job_results(job_id)
    
    # 2. Verify basic properties
    assert results.total_frames > 0, "No frames processed"
    assert results.decoded_frames > 0, "No frames decoded"
    assert results.unique_can_ids > 0, "No unique IDs found"
    assert len(results.anomalies) > 0, "No anomalies generated"
    
    # 3. Verify A1-A5 using authoritative ground truth
    gt_events = load_ground_truth(gt_path)
    evaluator = Evaluator(gt_events)
    
    metrics = evaluator.evaluate_incidents(results.incidents)
    overall = metrics['overall']
    
    # We expect recall to be 1.0 (all 5 anomalies detected)
    assert overall['true_positives'] == 5, f"Expected 5 true positives, got {overall['true_positives']}"
    assert overall['false_negatives'] == 0, f"Expected 0 false negatives, got {overall['false_negatives']}"
    assert overall['recall'] == 1.0, f"Expected perfect recall, got {overall['recall']}"
