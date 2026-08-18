from typing import Dict, Any, Optional
from app.models.can_frame import RawCanFrame, DecodedCanMessage
from app.storage.state_tracker import StateTracker

from app.features.frame_features import FrameFeatureExtractor
from app.features.timing_features import TimingFeatureExtractor
from app.features.signal_features import SignalFeatureExtractor
from app.features.cross_signal_features import CrossSignalFeatureExtractor

class FeaturePipeline:
    def __init__(self):
        self.state = StateTracker()
        self.extractors = [
            FrameFeatureExtractor(),
            TimingFeatureExtractor(),
            SignalFeatureExtractor(),
            CrossSignalFeatureExtractor()
        ]

    def process(self, frame: RawCanFrame, decoded: Optional[DecodedCanMessage] = None) -> Dict[str, Any]:
        """
        Runs the frame through all extractors and updates the state.
        Note: The order matters. We want to extract features *before* we update the state with the new decoded signals,
        so that rate_of_change has access to the previous signal value.
        However, cross_signal_features might want the *current* state of the other ECUs plus this frame's values.
        To handle this gracefully, we first update global_signals with the current frame's decoded values, 
        and the extractors receive the state. 
        Wait, if we update first, rate_of_change loses last_value.
        Let's extract features first, then update state.
        But for cross_signal, we need the *new* speed to conflict with the *old* engine status (or new if they arrive together, but they arrive separately).
        So we should temporarily update the state for cross_signal, or just let cross_signal use the current decoded frame + state.
        For simplicity, let's update global signals FIRST, but keep last_timestamp update INSIDE TimingFeatureExtractor.
        SignalFeatureExtractor manually handles last_value logic by looking at state before it's updated? 
        Actually, let's extract all features, then update state.
        For cross-signal, if we extract first, it uses the *old* vehicle speed. 
        We should pass `decoded` to CrossSignalFeatureExtractor, but CrossSignalFeatureExtractor just reads `state`.
        Let's update `state.global_signals` FIRST, then extract, then `TimingFeatureExtractor` updates timestamps.
        Actually, let's do:
        1. Rate of change needs old value -> Extract signal features first? 
        Let's just pass `decoded` and `state`. Extractors can read `state`.
        Then update `state`.
        """
        features = {
            "timestamp": frame.timestamp,
            "can_id": frame.arbitration_id,
            "dlc": frame.dlc
        }
        
        # 1. Update global signals so cross-signal checks use the latest data from this frame
        if decoded:
            # But we need old signal for rate of change!
            # We will rely on extractors to use `decoded` for current values, and `state` for previous values.
            pass
            
        # 2. Extract features
        for extractor in self.extractors:
            ext_feats = extractor.extract(frame, decoded, self.state)
            features.update(ext_feats)
            
        # 3. Update state
        if decoded:
            self.state.update_signals(decoded)
            
        # TimingFeatureExtractor already updates the timestamp internally after computing delta.
        # This is a bit coupled, but works for the pipeline.
        
        return features
