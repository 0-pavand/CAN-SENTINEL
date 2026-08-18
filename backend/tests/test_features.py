import pytest
from app.features.pipeline import FeaturePipeline
from app.models.can_frame import RawCanFrame, DecodedCanMessage, SignalValue

def test_pipeline_timing_features():
    pipeline = FeaturePipeline()
    
    # First frame
    f1 = RawCanFrame(timestamp=1.0, arbitration_id=416, dlc=8, data=b'\x00'*8)
    feats1 = pipeline.process(f1, None)
    
    assert feats1["can_id"] == 416
    assert feats1["delta_time"] == 0.0 # First time seen
    
    # Second frame (flood attack)
    f2 = RawCanFrame(timestamp=1.001, arbitration_id=416, dlc=8, data=b'\x00'*8)
    feats2 = pipeline.process(f2, None)
    
    assert pytest.approx(feats2["delta_time"]) == 0.001
    assert pytest.approx(feats2["timing_deviation"]) == 0.009 # expected is 0.01

def test_pipeline_cross_signal():
    pipeline = FeaturePipeline()
    
    # Frame 1: Engine turns OFF
    engine_sig = SignalValue(name="Engine_Status", raw_value=0, physical_value="OFF", unit="", enum_label="OFF")
    dec1 = DecodedCanMessage(timestamp=1.0, can_id=201, message_name="EngineData", signals={"Engine_Status": engine_sig}, raw_payload=b'')
    f1 = RawCanFrame(timestamp=1.0, arbitration_id=201, dlc=8, data=b'')
    pipeline.process(f1, dec1)
    
    # Frame 2: Speed is 120 (impossible since engine is OFF)
    speed_sig = SignalValue(name="Vehicle_Speed", raw_value=12000, physical_value=120.0, unit="km/h")
    dec2 = DecodedCanMessage(timestamp=1.1, can_id=416, message_name="VehicleSpeed", signals={"Vehicle_Speed": speed_sig}, raw_payload=b'')
    f2 = RawCanFrame(timestamp=1.1, arbitration_id=416, dlc=8, data=b'')
    feats2 = pipeline.process(f2, dec2)
    
    assert feats2["speed_engine_conflict"] == 1
    assert feats2["Vehicle_Speed_dist_from_range"] == 0.0
    
def test_pipeline_out_of_bounds():
    pipeline = FeaturePipeline()
    
    rpm_sig = SignalValue(name="Engine_RPM", raw_value=0xFFFF, physical_value=16383.75, unit="RPM", valid_range=(0, 8000))
    dec1 = DecodedCanMessage(timestamp=1.0, can_id=201, message_name="EngineData", signals={"Engine_RPM": rpm_sig}, raw_payload=b'')
    f1 = RawCanFrame(timestamp=1.0, arbitration_id=201, dlc=8, data=b'')
    feats1 = pipeline.process(f1, dec1)
    
    assert pytest.approx(feats1["Engine_RPM_dist_from_range"]) == 65535 - 8000
