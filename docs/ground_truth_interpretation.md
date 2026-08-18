# Ground Truth Interpretation

The ground truth anomalies extracted from `CAN.log` are modeled dynamically to evaluate the performance of our Anomaly Detection algorithms. Because CAN bus events operate across discrete frames (e.g., a single burst frame) and continuous intervals (e.g., a flooded channel or a silent missing node), the Evaluator engine implements specific logic.

## Event vs. Frame Level Evaluation
We evaluate at the **Event Level**.
When an anomaly occurs, it represents a state-space failure. 
- **Discrete Events (A1, A3)**: The start and end timestamps match exactly. A true positive is logged if an alert is fired at this exact timestamp (plus network latency tolerance).
- **Continuous Events (A2, A4, A5)**: These span across a duration of time (e.g., A4 spans 10 seconds of silence). A true positive is logged if the detector raises an alert *at any point* during this interval. The algorithm does not penalize for multiple alerts raised during the same anomaly interval, they simply map back to the single Ground Truth Event (preventing False Positives from being incorrectly padded).

## Evaluation Metrics

- **True Positives (TP)**: Ground truth anomalies successfully detected.
- **False Negatives (FN)**: Ground truth anomalies that were missed.
- **False Positives (FP)**: Alerts fired outside of any ground truth anomaly window.
- **Precision**: `TP / (TP + FP)`. High precision means very few false alarms.
- **Recall**: `TP / (TP + FN)`. High recall means very few missed anomalies.
- **F1 Score**: Harmonic mean of Precision and Recall.
- **Detection Latency**: `Alert Timestamp - Event Start Timestamp`. Evaluates how fast a continuous attack (like flooding) was caught after it began.

## Handling the Missing Message Timeout (A4)
Because A4 is an event characterized by an *absence* of frames rather than a malicious frame, the Evaluator treats the entire 10 seconds as a valid detection window. If the detector relies on a 30ms timeout rule, its expected latency should be exactly `~30ms`.
