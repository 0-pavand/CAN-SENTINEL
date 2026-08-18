from typing import Dict, List
from app.models.can_frame import RawCanFrame

class ParserStatistics:
    def __init__(self):
        self.total_frames: int = 0
        self.unique_can_ids: set = set()
        self.min_timestamp: float = float('inf')
        self.max_timestamp: float = 0.0
        self.frames_per_id: Dict[int, int] = {}
        self.dlc_distribution: Dict[int, int] = {}

    def update(self, frame: RawCanFrame):
        self.total_frames += 1
        self.unique_can_ids.add(frame.arbitration_id)
        
        if frame.timestamp < self.min_timestamp:
            self.min_timestamp = frame.timestamp
        if frame.timestamp > self.max_timestamp:
            self.max_timestamp = frame.timestamp
            
        self.frames_per_id[frame.arbitration_id] = self.frames_per_id.get(frame.arbitration_id, 0) + 1
        self.dlc_distribution[frame.dlc] = self.dlc_distribution.get(frame.dlc, 0) + 1

    def summary(self) -> str:
        if self.total_frames == 0:
            return "No frames parsed."
        
        lines = [
            "=== Parser Statistics ===",
            f"Total frames: {self.total_frames}",
            f"Unique CAN IDs: {len(self.unique_can_ids)}",
            f"Min timestamp: {self.min_timestamp:.6f}",
            f"Max timestamp: {self.max_timestamp:.6f}",
            "",
            "--- Frames per CAN ID ---"
        ]
        
        for can_id, count in sorted(self.frames_per_id.items()):
            lines.append(f"  0x{can_id:03X} ({can_id}): {count}")
            
        lines.append("")
        lines.append("--- DLC Distribution ---")
        for dlc, count in sorted(self.dlc_distribution.items()):
            lines.append(f"  DLC {dlc}: {count}")
            
        return "\n".join(lines)
