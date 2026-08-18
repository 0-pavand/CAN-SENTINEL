from typing import Dict, Any, Optional
from app.models.can_frame import DecodedCanMessage

class StateTracker:
    """
    Maintains the state required for feature engineering (timing, cross-signal).
    """
    def __init__(self):
        # Maps can_id -> float (timestamp)
        self.last_seen_timestamps: Dict[int, float] = {}
        
        # Maps signal_name -> physical_value (float or string)
        self.global_signals: Dict[str, Any] = {}
        
        # Maps can_id -> expected cycle time (from DBC)
        self.expected_cycle_times = {
            201: 0.1,    # EngineData 100ms
            416: 0.01,   # VehicleSpeed 10ms
            432: 0.01,   # TransmissionData 10ms
            512: 0.1,    # FuelData 100ms
            640: 0.1,    # BodyControl 100ms
            768: 0.5,    # DiagnosticsData 500ms
            896: 0.05,   # ADASData 50ms
            1024: 0.01   # SteeringData 10ms
        }

    def update_timestamp(self, can_id: int, timestamp: float):
        self.last_seen_timestamps[can_id] = timestamp

    def get_last_timestamp(self, can_id: int) -> Optional[float]:
        return self.last_seen_timestamps.get(can_id)

    def update_signals(self, decoded: DecodedCanMessage):
        for sig_name, sig_val in decoded.signals.items():
            self.global_signals[sig_name] = sig_val.physical_value

    def get_signal(self, name: str) -> Any:
        return self.global_signals.get(name)

    def get_expected_cycle(self, can_id: int) -> float:
        return self.expected_cycle_times.get(can_id, 0.0)
