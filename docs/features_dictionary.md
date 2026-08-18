# CAN Anomaly Features Dictionary

This dictionary defines every feature engineered in the pipeline and the exact rationale for its inclusion in the anomaly detection framework.

## Frame Features
Extract physical and payload characteristics regardless of DBC parsing success.

- `dlc_match`: (Boolean). `1` if the observed Data Length Code matches the DBC definition, `0` otherwise. Captures structurally malformed packets (e.g. A5 DLC=0).
- `payload_entropy`: (Float). Shannon entropy of the raw payload bytes. Low entropy points to test patterns (AA/55) or stuck bits (all 0xFF), which often occur during bus hardware failures.
- `all_zero`: (Boolean). True if every byte in the payload is `0x00`. Indicates ECU crash or reset.
- `all_ff`: (Boolean). True if every byte is `0xFF`. Indicates a bus short-to-high or termination issue.

## Timing Features
Captures temporal anomalies by measuring network latency and broadcast periods.

- `delta_time`: (Float). Time in seconds since the last message on this specific CAN ID.
- `timing_deviation`: (Float). The absolute difference between `delta_time` and the DBC expected cycle time (e.g. 10ms for `0x1A0`). Spikes in deviation capture Flood Attacks (A2) and Missing Node/Timeout Attacks (A4).

## Signal Features
Captures individual physical state values parsed from the DBC.

- `distance_from_valid_range`: (Float). If a signal is outside its DBC-defined `valid_range` (e.g. [0, 8000]), this measures the absolute Euclidean distance past the boundary. It directly flags A1 (Out-of-Range). Values within bounds equal `0.0`.
- `rate_of_change`: (Float). The derivative of the signal `(current - previous) / delta_time`. Plausible physics check (e.g. vehicle speed cannot jump 100km/h in 10ms).

## Cross-Signal Features
Captures logical inter-ECU dependencies.

- `speed_engine_conflict`: (Boolean). True if `Vehicle_Speed > 0` AND `Engine_Status == OFF`. Flags physically impossible scenarios where spoofed data contradicts actual state (A3).
- `speed_gear_conflict`: (Boolean). True if `Vehicle_Speed > 0` AND `Gear_Position == PARK`.
