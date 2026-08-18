from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

class RawCanFrame(BaseModel):
    timestamp: float
    channel: str = "1"
    arbitration_id: int
    direction: str = "Rx"
    dlc: int
    data: bytes
    raw_line: str = ""

class SignalValue(BaseModel):
    name: str
    raw_value: float
    physical_value: Any
    unit: str
    valid_range: Optional[tuple] = None
    enum_label: Optional[str] = None

class DecodedCanMessage(BaseModel):
    timestamp: float
    can_id: int
    message_name: str
    signals: Dict[str, SignalValue]
    raw_payload: bytes

class AnomalyAlert(BaseModel):
    timestamp: float
    can_id: Optional[int] = None
    anomaly_type: str
    severity: str = "HIGH"
    description: str
