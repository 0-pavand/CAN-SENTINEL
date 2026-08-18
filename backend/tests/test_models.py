import pytest
from pydantic import ValidationError
from app.models.can_frame import RawCanFrame, DecodedCanMessage, AnomalyAlert, SignalValue

def test_raw_can_frame_creation():
    frame = RawCanFrame(
        timestamp=1.0,
        arbitration_id=0xC9,
        dlc=8,
        data=b'\x00\x00\x00\x00\x00\x00\x00\x00'
    )
    assert frame.arbitration_id == 201
    assert frame.dlc == 8

def test_raw_can_frame_validation():
    with pytest.raises(ValidationError):
        # Missing required fields
        RawCanFrame(timestamp=1.0)

def test_decoded_message_creation():
    signal = SignalValue(
        name="Engine_RPM",
        raw_value=6000,
        physical_value=1500.0,
        unit="RPM",
        valid_range=(0, 8000)
    )
    msg = DecodedCanMessage(
        timestamp=1.0,
        can_id=0xC9,
        message_name="EngineData",
        signals={"Engine_RPM": signal},
        raw_payload=b'\x00'
    )
    assert msg.signals["Engine_RPM"].physical_value == 1500.0

def test_anomaly_alert_creation():
    alert = AnomalyAlert(
        timestamp=1.5,
        anomaly_type="Timing Flood",
        description="Message rate too high."
    )
    assert alert.severity == "HIGH"
