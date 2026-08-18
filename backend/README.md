# CAN Anomaly Detector - Backend

This is the backend architecture for the CAN Anomaly Detector, designed for minimal overhead, clean separation of concerns, and future offline (Capacitor) integration.

## Project Structure
- `app/core/`: Configuration, logging, and error definitions.
- `app/models/`: Pydantic data models representing CAN frames and decoded payloads.
- `app/services/`: Interface definitions for Parsers, Decoders, Detectors, and Storage.
- `app/api/`: Future REST/Websocket API routes.
- `app/dbc/`: Future DBC file parsing and extraction logic.
- `app/detectors/`: Future anomaly detection logic (Rule-based, statistical, ML).
- `scripts/`: Entry point scripts for running without a web server.
- `tests/`: Pytest suite.

## Setup and Run

### 1. Create a virtual environment
```bash
python -m venv venv
source venv/bin/activate
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Run Tests
```bash
pytest
```

### 4. Run CLI
```bash
# Check engine status
export PYTHONPATH=.
python scripts/cli.py status
```
