import os
import pytest
from app.dbc.decoder import DbcDecoder
from app.models.can_frame import RawCanFrame
from app.core.errors import DbcDecodingError

@pytest.fixture
def decoder():
    dbc_path = os.path.join(os.path.dirname(__file__), '../../data/CAN.dbc')
    return DbcDecoder(dbc_path)

def test_decode_engine_rpm_anomaly(decoder):
    # A1: Engine_RPM = 0xFFFF -> 16383.75 RPM
    frame = RawCanFrame(
        timestamp=4.023105,
        arbitration_id=0xC9,
        dlc=8,
        data=bytes([0xFF, 0xFF, 0x00, 0x00, 0xAA, 0xBB, 0xCC, 0xDD])
    )
    decoded = decoder.decode(frame)
    assert decoded.message_name == "EngineData"
    rpm_signal = decoded.signals["Engine_RPM"]
    assert rpm_signal.physical_value == 16383.75
    assert rpm_signal.unit == "RPM"

def test_decode_vehicle_speed(decoder):
    # Vehicle_Speed 120km/h -> 12000 raw -> 0x2EE0
    # In little endian, 0x2EE0 -> E0 2E
    frame = RawCanFrame(
        timestamp=4.023000,
        arbitration_id=0x1A0,
        dlc=8,
        data=bytes([0xE0, 0x2E, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
    )
    decoded = decoder.decode(frame)
    assert decoded.message_name == "VehicleSpeed"
    speed_signal = decoded.signals["Vehicle_Speed"]
    assert speed_signal.physical_value == 120.0
    assert speed_signal.unit == "km/h"

def test_decode_engine_status_off(decoder):
    frame = RawCanFrame(
        timestamp=4.023000,
        arbitration_id=0xC9,
        dlc=8,
        data=bytes([0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x00, 0x00])
    )
    decoded = decoder.decode(frame)
    assert decoded.signals["Engine_Status"].enum_label == "OFF"
    assert decoded.signals["Engine_Status"].physical_value == "OFF"
    assert decoded.signals["Engine_Status"].raw_value == 0

def test_decode_gear_position_park(decoder):
    frame = RawCanFrame(
        timestamp=4.023000,
        arbitration_id=0x1B0,
        dlc=8,
        data=bytes([0x00, 0x3C, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
    )
    decoded = decoder.decode(frame)
    assert decoded.signals["Gear_Position"].enum_label == "PARK"

def test_malformed_dlc_zero(decoder):
    # A5 DLC=0 frame
    frame = RawCanFrame(
        timestamp=6.7,
        arbitration_id=0xC9,
        dlc=0,
        data=b''
    )
    with pytest.raises(DbcDecodingError) as exc:
        decoder.decode(frame)
    assert "DLC mismatch" in str(exc.value)

def test_unknown_can_id(decoder):
    frame = RawCanFrame(
        timestamp=1.0,
        arbitration_id=0x999,
        dlc=8,
        data=bytes([0]*8)
    )
    with pytest.raises(DbcDecodingError) as exc:
        decoder.decode(frame)
    assert "not found in DBC" in str(exc.value)
