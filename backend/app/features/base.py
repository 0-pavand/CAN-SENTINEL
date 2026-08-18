from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from app.models.can_frame import RawCanFrame, DecodedCanMessage

class FeatureExtractor(ABC):
    """Base class for all feature extractors."""
    
    @abstractmethod
    def extract(self, 
                frame: RawCanFrame, 
                decoded: Optional[DecodedCanMessage], 
                state: Any = None) -> Dict[str, Any]:
        """
        Extract features from a CAN frame and its decoded representation.
        Returns a dictionary of feature names to values.
        """
        pass
