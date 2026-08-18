import os
import cantools
from typing import Dict, Any, Optional

from app.services.interfaces import DecoderInterface
from app.models.can_frame import RawCanFrame, DecodedCanMessage, SignalValue
from app.core.errors import DbcDecodingError
from app.core.logger import get_logger

logger = get_logger(__name__)

class DbcDecoder(DecoderInterface):
    def __init__(self, dbc_path: str):
        if not os.path.exists(dbc_path):
            raise FileNotFoundError(f"DBC file not found: {dbc_path}")
        self.db = cantools.database.load_file(dbc_path)
        logger.info(f"Loaded DBC with {len(self.db.messages)} messages.")

    def decode(self, frame: RawCanFrame) -> DecodedCanMessage:
        try:
            message = self.db.get_message_by_frame_id(frame.arbitration_id)
        except KeyError:
            raise DbcDecodingError(f"Message ID {frame.arbitration_id} not found in DBC")

        if frame.dlc != message.length:
            raise DbcDecodingError(f"DLC mismatch for ID {frame.arbitration_id}: expected {message.length}, got {frame.dlc}")

        try:
            # Decode payload, getting physical values (with scaling/offset applied)
            # Use decode_choices=False to get numerical values even for enums, 
            # so we can populate both raw_value and enum_label cleanly if we want.
            # But cantools decode() without decode_choices=False returns string labels for enums.
            # Let's decode twice: once for physical values, once for raw values, or just use decode() 
            # and manually extract choices if it's a string.
            
            # Cantools handles start bit, length, endianness, signed/unsigned automatically
            physical_data = message.decode(frame.data, decode_choices=True)
            raw_data = message.decode(frame.data, decode_choices=False)
            
            signals = {}
            for sig in message.signals:
                if sig.name in physical_data:
                    phys_val = physical_data[sig.name]
                    raw_val = raw_data[sig.name]
                    
                    enum_label = None
                    if sig.choices:
                        enum_label = str(phys_val)
                    elif isinstance(phys_val, str):
                        enum_label = phys_val
                    
                    # For some signals, phys_val could be a NamedSignalValue if cantools does that, 
                    # but usually it's a string or number.
                    
                    valid_range = None
                    if sig.minimum is not None and sig.maximum is not None:
                        valid_range = (sig.minimum, sig.maximum)
                        
                    signals[sig.name] = SignalValue(
                        name=sig.name,
                        raw_value=float(raw_val) if raw_val is not None and not isinstance(raw_val, str) else 0.0,
                        physical_value=phys_val,
                        unit=sig.unit if sig.unit else "",
                        valid_range=valid_range,
                        enum_label=enum_label
                    )
                    
            return DecodedCanMessage(
                timestamp=frame.timestamp,
                can_id=frame.arbitration_id,
                message_name=message.name,
                signals=signals,
                raw_payload=frame.data
            )

        except Exception as e:
            raise DbcDecodingError(f"Failed to decode message ID {frame.arbitration_id}: {str(e)}")
