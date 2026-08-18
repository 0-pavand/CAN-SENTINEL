import math
from typing import Dict, Any, Optional
from app.features.base import FeatureExtractor
from app.models.can_frame import RawCanFrame, DecodedCanMessage

def calculate_entropy(data: bytes) -> float:
    if not data:
        return 0.0
    entropy = 0
    for x in range(256):
        p_x = float(data.count(x)) / len(data)
        if p_x > 0:
            entropy += - p_x * math.log(p_x, 2)
    return entropy

class FrameFeatureExtractor(FeatureExtractor):
    def extract(self, frame: RawCanFrame, decoded: Optional[DecodedCanMessage], state: Any = None) -> Dict[str, Any]:
        all_zero = 1 if all(b == 0x00 for b in frame.data) and frame.dlc > 0 else 0
        all_ff = 1 if all(b == 0xFF for b in frame.data) and frame.dlc > 0 else 0
        
        # AA/55 check
        is_test_pattern = 0
        if frame.dlc > 0:
            is_test_pattern = 1 if all(b in (0xAA, 0x55) for b in frame.data) else 0

        # DLC Match
        # In a real system, we'd look up the expected DLC from DBC. 
        # But we can approximate it: if we have `decoded`, then it matched the DBC DLC (since our decoder checks it).
        # Alternatively, if decoding failed (decoded is None) due to DLC mismatch, we can flag it.
        # But wait, our decoder raises an exception. We'll handle that in the pipeline.
        dlc_match = 1 if decoded is not None else 0

        return {
            "dlc_match": dlc_match,
            "payload_entropy": calculate_entropy(frame.data),
            "all_zero": all_zero,
            "all_ff": all_ff,
            "aa_55_pattern": is_test_pattern
        }
