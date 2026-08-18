from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from app.models.can_frame import AnomalyAlert
from app.storage.state_tracker import StateTracker

class DetectorInterface(ABC):
    """
    Abstract base class for rule-based detectors.
    """
    @abstractmethod
    def evaluate(self, features: Dict[str, Any], state: Optional[StateTracker] = None) -> List[AnomalyAlert]:
        """
        Evaluate a single feature row and return a list of AnomalyAlerts if any rules are triggered.
        """
        pass
