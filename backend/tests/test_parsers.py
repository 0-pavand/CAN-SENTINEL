import os
import pytest
from app.parsers.asc_parser import ASCParser

def test_parse_normal_frame():
    parser = ASCParser()
    line = "   0.100000 1  0C9  Rx  d 8  20 00 30 50 01 40 00 00"
    frame = parser._parse_line(line)
    
    assert frame is not None
    assert frame.timestamp == 0.1
    assert frame.channel == "1"
    assert frame.arbitration_id == 0xC9
    assert frame.direction == "Rx"
    assert frame.dlc == 8
    assert frame.data == bytes([0x20, 0x00, 0x30, 0x50, 0x01, 0x40, 0x00, 0x00])

def test_parse_dlc_zero_frame():
    parser = ASCParser()
    line = "   6.700000 1  0C9  Rx  d 0"
    frame = parser._parse_line(line)
    
    assert frame is not None
    assert frame.dlc == 0
    assert frame.data == b''

def test_ignore_comments_and_malformed():
    parser = ASCParser()
    assert parser._parse_line("// This is a comment") is None
    assert parser._parse_line("date Thu Apr 15 00:00:00 2025") is None
    assert parser._parse_line("   0.100000 1  0C9  Rx  d 8  20 00") is None  # Missing bytes for DLC 8

def test_actual_can_log():
    # Use the real CAN.log file
    filepath = os.path.join(os.path.dirname(__file__), '../../data/CAN.log')
    
    parser = ASCParser()
    frames = list(parser.parse(filepath))
    
    assert len(frames) > 0, "Should have parsed frames from CAN.log"
    
    # 1. Verify A2 (rapid 0x1A0 frames around 2.010 - 2.100)
    # They happen every 1ms
    a2_frames = [f for f in frames if f.arbitration_id == 0x1A0 and 2.010 <= f.timestamp <= 2.100]
    assert len(a2_frames) > 10, "Should find many rapid 0x1A0 frames for A2"
    
    # 2. Verify A1 (16383.75 RPM raw hex frame) at ~4.023105
    a1_frames = [f for f in frames if f.arbitration_id == 0xC9 and abs(f.timestamp - 4.023105) < 0.0001]
    assert len(a1_frames) == 1, "Should find exact A1 frame"
    assert a1_frames[0].data == bytes([0xFF, 0xFF, 0x00, 0x00, 0xAA, 0xBB, 0xCC, 0xDD])
    
    # 3. Verify A5 (DLC=0 frame) at 6.700000
    a5_frames = [f for f in frames if f.arbitration_id == 0xC9 and f.dlc == 0 and abs(f.timestamp - 6.7) < 0.0001]
    assert len(a5_frames) == 1, "Should find A5 DLC=0 frame"
    
    # 4. Verify A4 (missing 0x1B0 interval 8.0-18.0)
    # Check that there are NO 0x1B0 frames between 8.1 and 17.9
    a4_missing = [f for f in frames if f.arbitration_id == 0x1B0 and 8.1 <= f.timestamp <= 17.9]
    assert len(a4_missing) == 0, "Should find no 0x1B0 frames in the missing interval A4"
    
    # Check it resumes at 18.0
    a4_resumed = [f for f in frames if f.arbitration_id == 0x1B0 and f.timestamp == 18.0]
    assert len(a4_resumed) == 1, "0x1B0 should resume at 18.0"
