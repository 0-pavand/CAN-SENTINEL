# Dataset Analysis

## Technical Understanding of the Dataset
The provided dataset consists of two primary files:
1. **`CAN.log`**: A Vector ASC (SocketCAN Compatible) log file containing a 21-second trace of CAN bus traffic. The dataset contains regular cyclic baseline traffic intertwined with explicit, labeled anomaly scenarios (A1–A5).
2. **`CAN.dbc`**: The CAN Database file defining the exact structure, IDs, payloads, and scaling factors of the network. It functions as the ground truth for translating raw CAN frames into human-readable signals.

## CAN Messages Defined in the DBC

| Message Name | Message ID (Dec) | Message ID (Hex) | Sending Node | Cycle Time |
|---|---|---|---|---|
| `EngineData` | 201 | 0xC9 | Engine_ECU | 100 ms |
| `VehicleSpeed` | 416 | 0x1A0 | ABS_ECU | 10 ms |
| `TransmissionData` | 432 | 0x1B0 | Transmission_ECU | 10 ms |
| `FuelData` | 512 | 0x200 | Engine_ECU | 100 ms |
| `BodyControl` | 640 | 0x280 | Body_ECU | 100 ms |
| `DiagnosticsData` | 768 | 0x300 | Gateway_ECU | 500 ms |
| `ADASData` | 896 | 0x380 | Gateway_ECU | 50 ms |
| `SteeringData` | 1024 | 0x400 | Dashboard_ECU | 10 ms |

## Relevant Signals

| Message | Signal Name | Scale | Offset | Valid Range | Unit |
|---|---|---|---|---|---|
| `EngineData` | `Engine_RPM` | 0.25 | 0 | 0 to 8000 | RPM |
| `EngineData` | `Coolant_Temp` | 1 | -40 | -40 to 215 | degC |
| `EngineData` | `Engine_Status` | 1 | 0 | 0 to 1 | - |
| `EngineData` | `Throttle_Pos` | 0.392156 | 0 | 0 to 100 | % |
| `EngineData` | `Engine_Load` | 0.392156 | 0 | 0 to 100 | % |
| `VehicleSpeed` | `Vehicle_Speed` | 0.01 | 0 | 0 to 300 | km/h |
| `VehicleSpeed` | `Brake_Status` | 1 | 0 | 0 to 1 | - |
| `VehicleSpeed` | `Door_Status` | 1 | 0 | 0 to 1 | - |
| `VehicleSpeed` | `ABS_Active` | 1 | 0 | 0 to 1 | - |
| `VehicleSpeed` | `Wheel_Speed_FL` | 0.01 | 0 | 0 to 300 | km/h |
| `VehicleSpeed` | `Wheel_Speed_FR` | 0.01 | 0 | 0 to 300 | km/h |
| `TransmissionData` | `Gear_Position` | 1 | 0 | 0 to 8 | - |
| `TransmissionData` | `Transmission_Temp` | 1 | -40 | -40 to 150 | degC |
| `TransmissionData` | `Torque_Converter` | 0.392156 | 0 | 0 to 100 | % |
| `TransmissionData` | `Shift_Status` | 1 | 0 | 0 to 3 | - |

*(Note: Similar definitions exist for Fuel, Body, Diagnostics, ADAS, and Steering datasets. See `CAN.dbc` for exhaustive mapping).*

## Enumerated Values

| Signal | Enumerations |
|---|---|
| `Engine_Status` | 0="OFF", 1="RUNNING" |
| `Brake_Status` | 0="OFF", 1="ON" |
| `Door_Status` | 0="CLOSED", 1="OPEN" |
| `ABS_Active` | 0="INACTIVE", 1="ACTIVE" |
| `Gear_Position` | 0="PARK", 1="REVERSE", 2="NEUTRAL", 3="DRIVE", 4="1st", 5="2nd", 6="3rd", 7="4th", 8="5th" |
| `Shift_Status` | 0="STABLE", 1="UPSHIFT", 2="DOWNSHIFT", 3="ERROR" |

## Dataset Anomalies (A1–A5)

| Anomaly ID | Type | Ground-Truth Timestamps | Affected Messages/Signals |
|---|---|---|---|
| **A1** | Out-of-Range | ~ 4.023105 | `0xC9` (`Engine_RPM`) |
| **A2** | Timing Flood | 2.010 – 2.110 | `0x1A0` (`VehicleSpeed`) |
| **A3** | Logic Contradict | ~ 4.023000 | `0x1A0` (`Vehicle_Speed`), `0xC9` (`Engine_Status`), `0x1B0` (`Gear_Position`) |
| **A4** | Missing Timeout | 8.000 – 18.000 | `0x1B0` (`TransmissionData`) |
| **A5** | Data Corruption | 6.500 – 6.750 | `0xC9` (DLC=0, all 0xFF), `0x1A0` (all 0x00, AA/55 pattern) |

## Detection Methodology & Suitability

1. **A1 (Out-of-Range):**
   - *Detection Strategy:* Extract `Engine_RPM` and compare it against the valid DBC range [0, 8000].
   - *Suitability:* **Deterministic/Rule-based**.

2. **A2 (Timing Flood):**
   - *Detection Strategy:* Compute the time interval (`dt`) between consecutive `0x1A0` messages. If `dt` significantly deviates from 10 ms (e.g. ~1 ms), flag as a flood.
   - *Suitability:* **Statistical/Rule-based**.

3. **A3 (Logical Contradict):**
   - *Detection Strategy:* Parse multiple message signals in the same time frame. If `Vehicle_Speed > 0` and (`Engine_Status == OFF` or `Gear_Position == PARK`), flag as a logical contradiction.
   - *Suitability:* **Deterministic/Rule-based**.

4. **A4 (Missing Timeout):**
   - *Detection Strategy:* Track the last received timestamp of `0x1B0`. If `current_time - last_seen_time > 30ms`, flag as a timeout.
   - *Suitability:* **Deterministic/Rule-based**.

5. **A5 (Data Corruption):**
   - *Detection Strategy:* Inspect the DLC length (expecting 8 for 0xC9). Check the payload for zero variance (e.g., all 0xFF or 0x00) or high regularity (0xAA 0x55).
   - *Suitability:* **Deterministic** (for DLC) and **Statistical** (for payload entropy/variance).

## Limitations of the Dataset for Deep Learning
1. **Size and Duration**: The dataset is only 21 seconds long and has under 500 rows, making it too small to effectively train a robust deep learning model from scratch.
2. **Artificial Anomalies**: The injected anomalies are highly explicit and deterministic. Real-world anomalies (like subtle spoofing) might exhibit much less obvious deviations.
3. **Lack of Baseline Variety**: Normal traffic consists of repetitive loops rather than stochastic real-world vehicle maneuvers. A model would memorize this pattern rather than generalize normal vehicle behavior.
