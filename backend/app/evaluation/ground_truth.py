import json
from typing import List
from pydantic import BaseModel

class GroundTruthEvent(BaseModel):
    anomaly_id: str
    anomaly_type: str
    start_time: float
    end_time: float
    affected_can_ids: List[int]
    affected_signals: List[str]
    severity: str
    description: str
    source_reference: str
    expected_detection_mechanism: str

def load_ground_truth(filepath: str) -> List[GroundTruthEvent]:
    with open(filepath, 'r') as f:
        data = json.load(f)
    return [GroundTruthEvent(**item) for item in data]
