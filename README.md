# CAN Sentinel

A comprehensive Deep Learning and Rule-based CAN bus anomaly detection system. It includes an offline-first Android application and a FastAPI backend for data preprocessing and analysis.

## Project Structure

- `backend/`: FastAPI application for initial data processing, ML model generation (LSTM Autoencoder), and feature extraction.
- `can-sentinel/`: Capacitor/React front-end that builds into a fully offline Android application for analyzing CAN logs.
- `data/`: Dataset storage for `.log`, `.dbc`, and `.onnx` files.
- `docs/`: Documentation and research analysis.

## Key Features

- **Offline Analysis**: Analyze `.log` and `.dbc` files fully offline on Android using `onnxruntime-web`.
- **Hybrid Detection Engine**: Combines deterministic rules with Deep Learning (LSTM Autoencoder) for anomaly detection.
- **Multilingual Support**: Supports English, Tamil, Telugu, and Hindi.
- **Diagnostic Assistant**: AI-powered, offline diagnostic assistant for investigating CAN bus incidents.

## Setup

See `backend/README.md` for backend setup instructions, and `can-sentinel/README.md` (if available) for front-end/Android build instructions.
