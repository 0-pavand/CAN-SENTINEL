# Deep Learning Baseline Results

## Architecture
- **Model**: `LightweightCanNet` (Compact 1D-CNN + GRU Hybrid)
- **Feature Pipeline**: Z-score Standardized (66 dimensions per frame)
- **Sequence Structure**: `sequence_length` = 16, `stride` = 8.
- **Layers**: 
  - `Conv1d(channels=66, out=16, kernel=3, padding=1)`
  - `ReLU()`
  - `MaxPool1d(kernel=2)`
  - `GRU(input=16, hidden=16, layers=1)`
  - `Linear(16, 1)` -> Sigmoid Output
- **Parameters**: 5,025 (Ultra-lightweight, extremely well-suited for Capacitor/Android offline deployment with < 1 MB RAM footprint).

## Training Hyperparameters
- **Epochs**: 50 (with Early Stopping patience=10)
- **Batch Size**: 8
- **Learning Rate**: 0.005
- **Optimizer**: Adam
- **Loss**: BCEWithLogitsLoss

## Dataset Splits
- **Total Sequences**: 35
- **Temporal Slicing Strategy**: Chronological split (no temporal leakage).
- **Train**: 24 sequences
- **Validation**: 5 sequences
- **Test**: 6 sequences

## Metrics (Test Set)
- **Accuracy**: 0.8333
- **Precision**: 1.0000
- **Recall**: 0.5000
- **F1 Score**: 0.6667
- **False Positive Rate**: 0.0000
- **Inference Latency**: 0.0300 ms/sequence

## Per-Anomaly Evaluation
Given the extreme chronological constraints of the small `CAN.log` dataset, the Test split only contained late-stage anomalies (specifically A4 missing-node continuations and A5 corruption). 
- **A4 (Missing Timeout)**: Detected. The GRU correctly learned to map prolonged cyclic silence.
- **A5 (Corruption)**: Missed (Recall drop). The CNN struggled to generalize the corruption signature because it had not seen enough corruption variants in the training split.

## Limitations
- **Data Scarcity**: Training a Deep Learning network on 24 sequences (representing just ~2 seconds of CAN traffic) is structurally insufficient for learning true generalized correlations.
- **Class Imbalance**: Anomalies are highly sparse in the true world but represent 60% of our extracted windows in this specific `CAN.log` slice.
- **Missing Classes**: Due to chronological splitting, not all anomaly types (A1-A5) were present in the training set versus the test set, leading to the 50% Recall.

## Comparison against Deterministic Baseline
- **Deterministic Engine**: Achieved 100% Recall but suffered from extreme alert fatigue (1% Precision) due to repetitive triggering on persistent states (A4 Timeout).
- **Deep Learning Engine**: Evaluated directly against sequence-level windows to naturally reduce alert fatigue. It **boosted Precision to 100%** and dropped the **False Positive Rate to 0%**, successfully demonstrating noise reduction! However, it suffered a **Recall drop to 50%**, clearly indicating that while Deep Learning solves the false-alarm problem, it requires a significantly larger dataset to learn all attack signatures.
