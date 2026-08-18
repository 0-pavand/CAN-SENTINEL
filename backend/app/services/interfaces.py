from abc import ABC, abstractmethod
from typing import Iterator, List
from app.models.can_frame import RawCanFrame, DecodedCanMessage, AnomalyAlert

class ParserInterface(ABC):
    @abstractmethod
    def parse(self, filepath: str) -> Iterator[RawCanFrame]:
        pass

class DecoderInterface(ABC):
    @abstractmethod
    def decode(self, frame: RawCanFrame) -> DecodedCanMessage:
        pass

class DetectorInterface(ABC):
    @abstractmethod
    def process_frame(self, frame: RawCanFrame, decoded: DecodedCanMessage = None) -> List[AnomalyAlert]:
        pass

class StorageInterface(ABC):
    @abstractmethod
    def update_state(self, message: DecodedCanMessage):
        pass
    
    @abstractmethod
    def get_state(self, can_id: int):
        pass
