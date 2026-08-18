from typing import Dict, Any, Optional
from app.features.base import FeatureExtractor
from app.models.can_frame import RawCanFrame, DecodedCanMessage

class SignalFeatureExtractor(FeatureExtractor):
    def extract(self, frame: RawCanFrame, decoded: Optional[DecodedCanMessage], state: Any = None) -> Dict[str, Any]:
        features = {}
        
        if not decoded:
            return features
            
        for sig_name, sig_val in decoded.signals.items():
            # Add raw values for context
            features[f"{sig_name}_raw"] = sig_val.raw_value
            
            # If it's a number, compute distance
            # If it's a string enum, physical_value is string, we use raw_value
            dist = 0.0
            
            val = sig_val.raw_value
            if sig_val.valid_range:
                min_val, max_val = sig_val.valid_range
                if val < min_val:
                    dist = float(min_val - val)
                elif val > max_val:
                    dist = float(val - max_val)
                    
            features[f"{sig_name}_dist_from_range"] = dist
            
            # Rate of change
            rate = 0.0
            if state:
                last_val = state.get_signal(sig_name)
                # Ensure we only compute rate for numerical signals
                if last_val is not None and isinstance(val, (int, float)) and isinstance(last_val, (int, float)):
                    last_ts = state.get_last_timestamp(frame.arbitration_id)
                    if last_ts is not None:
                        dt = frame.timestamp - last_ts
                        if dt > 0:
                            rate = (val - last_val) / dt
            
            features[f"{sig_name}_rate_of_change"] = rate
            
        return features
