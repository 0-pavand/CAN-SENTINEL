# Backend Architecture

## Overview
The goal of this backend is to stream CAN bus log data, decode it according to the DBC specifications, detect anomalies in real-time or near real-time, and expose the results to a frontend application via an API.

## Proposed Backend Modules

### 1. Data Ingestion Module
- **Purpose**: Parse Vector ASC `.log` files line-by-line, imitating a live stream of raw CAN frames.
- **Functionality**: Reads timestamps, CAN IDs, DLC, and payload bytes, converting them into standard data objects to feed the pipeline.

### 2. DBC Decoding Module
- **Purpose**: Use `CAN.dbc` as the schema to decode raw payload bits into human-readable engineering values.
- **Functionality**: Applies offsets and scaling factors based on bit position. It translates the CAN frames into physical signals (e.g., RPM, vehicle speed).

### 3. State Management (In-Memory Cache)
- **Purpose**: Maintains temporal state across CAN messages.
- **Functionality**: Stores the "last seen" timestamp for every message ID (required for **A4** Missing Timeout) and the rolling time delta between message instances (required for **A2** Timing Flood). Stores current state across all ECUs to allow cross-message checks (required for **A3** Logical Contradiction).

### 4. Anomaly Detection Engine
- **Deterministic / Rule-Based Evaluator**:
  - Validates constraints mapped in the DBC (e.g., RPM out-of-range for **A1**).
  - Validates logical state constraints (**A3**).
  - Checks for timeouts (**A4**).
  - Detects simple payload corruption (e.g., `DLC = 0` or all `0xFF` for **A5**).
- **Statistical / Timing Evaluator**:
  - Analyzes the message frequency / period to identify flooding (**A2**).
  - Checks payload entropy for repeating test patterns (**A5**).

### 5. Deep Learning Strategy & Module (Future Phase)
- **Purpose**: Catch unknown or complex anomalies that bypass simple static rules.
- **Strategy**: Train an unsupervised reconstruction model (e.g., Autoencoder or LSTM) on sequences of normal vehicle data.
- **Inference**: High reconstruction error translates into an anomaly flag.
- **Current Limitation**: The supplied 21-second dataset is too small to train an effective DL model. DL implementation should be paused until a much larger, diverse normal baseline dataset is acquired.

### 6. API and Streaming Layer
- **Purpose**: Bridge the backend to the future offline-friendly Android application (Capacitor).
- **Functionality**: Provide REST endpoints for fetching historical anomaly logs and a WebSocket (or Server-Sent Events) connection to stream CAN data and anomaly alerts to the frontend in real-time.

## System Workflow
1. `CAN.log` is parsed and emitted frame-by-frame.
2. Frame ID and payload are checked against the DBC definitions.
3. The frame updates the Global State (timestamps, engineering values).
4. Detection Engine rules are run against the new state.
5. Detected anomalies generate alerts.
6. Analyzed frames and alerts are broadcast to the API/Frontend layer.

## Risks and Limitations
- **Dataset Constraint**: Very limited normal traffic means ML models would likely overfit. Therefore, the detection strategy heavily relies on deterministic rules for the MVP.
- **Latency/Performance**: Python (if chosen for backend) can struggle with high-frequency CAN ingestion in a naive implementation. Message processing must be efficient.
- **State Synchronisation**: The logic contradiction rule requires comparing signals from different messages arriving at slightly different times.

## Exact Next Implementation Phase
The exact next phase should be:
**Phase 1: Implement the Core Backend Engine**
- Build the `Data Ingestion Module` to parse `CAN.log`.
- Integrate a DBC parser library (e.g., `cantools` in Python) to extract signals.
- Build the `State Management` tracker.
- Write unit tests validating that frame payloads map exactly to the physical values required to catch A1-A5.
*(No UI or API code yet, just pure parsing and decoding logic).*
