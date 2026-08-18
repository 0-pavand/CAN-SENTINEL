from typing import Dict, Any, Optional
from app.features.base import FeatureExtractor
from app.models.can_frame import RawCanFrame, DecodedCanMessage

class TimingFeatureExtractor(FeatureExtractor):
    def extract(self, frame: RawCanFrame, decoded: Optional[DecodedCanMessage], state: Any = None) -> Dict[str, Any]:
        features = {
            "delta_time": 0.0,
            "timing_deviation": 0.0,
            "burst_rate": 0.0
        }
        
        if state:
            last_timestamp = state.get_last_timestamp(frame.arbitration_id)
            if last_timestamp is not None:
                delta = frame.timestamp - last_timestamp
                features["delta_time"] = delta
                
                expected_cycle = state.get_expected_cycle(frame.arbitration_id)
                if expected_cycle > 0:
                    features["timing_deviation"] = abs(delta - expected_cycle)
                
                if delta > 0:
                    features["burst_rate"] = 1.0 / delta
                else:
                    features["burst_rate"] = float('inf')
                    
            # Record the timestamp for next time
            state.update_timestamp(frame.arbitration_id, frame.timestamp)

        return features
