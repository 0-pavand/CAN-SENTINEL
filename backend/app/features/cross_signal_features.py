from typing import Dict, Any, Optional
from app.features.base import FeatureExtractor
from app.models.can_frame import RawCanFrame, DecodedCanMessage

class CrossSignalFeatureExtractor(FeatureExtractor):
    def extract(self, frame: RawCanFrame, decoded: Optional[DecodedCanMessage], state: Any = None) -> Dict[str, Any]:
        features = {
            "speed_engine_conflict": 0,
            "speed_gear_conflict": 0
        }
        
        # Get current global state values, but override with the current frame if available
        speed = state.get_signal("Vehicle_Speed") if state else None
        engine_status = state.get_signal("Engine_Status") if state else None
        gear = state.get_signal("Gear_Position") if state else None
        
        if decoded:
            if "Vehicle_Speed" in decoded.signals:
                speed = decoded.signals["Vehicle_Speed"].physical_value
            if "Engine_Status" in decoded.signals:
                engine_status = decoded.signals["Engine_Status"].physical_value
            if "Gear_Position" in decoded.signals:
                gear = decoded.signals["Gear_Position"].physical_value
        
        # Check speed vs engine status
        # Speed > 0 but engine is OFF (0 or "OFF")
        if speed is not None and engine_status is not None:
            speed_val = float(speed)
            is_off = (engine_status == "OFF" or engine_status == 0)
            if speed_val > 0 and is_off:
                features["speed_engine_conflict"] = 1
                
        # Check speed vs gear
        # Speed > 0 but gear is PARK (0 or "PARK")
        if speed is not None and gear is not None:
            speed_val = float(speed)
            is_park = (gear == "PARK" or gear == 0)
            if speed_val > 0 and is_park:
                features["speed_gear_conflict"] = 1
                
        return features
