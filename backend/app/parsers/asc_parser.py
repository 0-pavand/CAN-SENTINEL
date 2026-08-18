import os
from typing import Iterator
from app.models.can_frame import RawCanFrame
from app.services.interfaces import ParserInterface
from app.core.errors import ParserError
from app.core.logger import get_logger

logger = get_logger(__name__)

class ASCParser(ParserInterface):
    def parse(self, filepath: str) -> Iterator[RawCanFrame]:
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"File not found: {filepath}")
            
        with open(filepath, 'r') as f:
            for line_idx, line in enumerate(f, 1):
                raw = line.strip()
                if not raw:
                    continue
                if raw.startswith('//') or raw.startswith('date') or raw.startswith('base') or raw.startswith('begin') or raw.startswith('end') or raw.startswith('internal'):
                    continue
                    
                frame = self._parse_line(raw)
                if frame:
                    yield frame
                else:
                    logger.debug(f"Skipping malformed or unrecognized line {line_idx}: {raw}")

    def _parse_line(self, line: str) -> RawCanFrame:
        # Example format: 4.023105 1  0C9  Rx  d 8  FF FF 00 00 AA BB CC DD
        # Split by whitespace
        parts = line.split()
        
        try:
            # Need at least timestamp, channel, id, direction, type, dlc
            if len(parts) < 6:
                return None
                
            timestamp_str = parts[0]
            channel = parts[1]
            can_id_str = parts[2]
            direction = parts[3]
            frame_type = parts[4]
            dlc_str = parts[5]
            
            # Simple heuristic validation
            if direction not in ['Rx', 'Tx'] or frame_type not in ['d', 'r']:
                return None
                
            timestamp = float(timestamp_str)
            arbitration_id = int(can_id_str, 16)
            dlc = int(dlc_str)
            
            # Extract payload
            payload_parts = parts[6:6+dlc]
            
            if len(payload_parts) < dlc:
                return None
                
            data = bytes([int(x, 16) for x in payload_parts])
            
            return RawCanFrame(
                timestamp=timestamp,
                channel=channel,
                arbitration_id=arbitration_id,
                direction=direction,
                dlc=dlc,
                data=data,
                raw_line=line
            )
        except (ValueError, TypeError) as e:
            return None
