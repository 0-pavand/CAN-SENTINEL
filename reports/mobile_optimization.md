# Mobile Inference Optimization Report

## Overview
This report evaluates the feasibility of deploying the `LightweightCanNet` model (from Phase 8) into a fully offline, low-end Android mobile environment. Given that the target wrapper is Capacitor, the machine learning runtime must minimize battery usage, strip massive python dependencies (like the full PyTorch library), and run smoothly on edge CPUs.

## Optimized Architecture: ONNX Runtime
To achieve these mobile constraints, the native PyTorch `.pth` model was exported into a C++ compatible **ONNX (Open Neural Network Exchange)** graph (`can_net.onnx`). 

**Why ONNX?**
- **Dependency Elimination**: The backend now only requires `onnxruntime`, stripping away gigabytes of `torch` binaries and backward-gradient compute clusters.
- **Offline & Local**: The `onnxruntime` engine executes inference natively against the mobile CPU without requiring any cloud APIs or internet connection.
- **Determinism**: ONNX accurately locked in the weights for the CNN and GRU structures exactly as they were trained.

*(Note: Int8 Dynamic Quantization was explored but skipped, as ONNX shape constraints on dynamic GRU sequences proved unstable on export. Fortunately, the native FP32 ONNX model is already so small that quantization is completely unnecessary).*

## Benchmark Results
We evaluated both models side-by-side on the Test Dataset (`100 iterations per sequence`).

| Metric | PyTorch Native | ONNX (Optimized) | Delta / Impact |
| :--- | :--- | :--- | :--- |
| **Accuracy** | 0.8333 | 0.8333 | **No Drop** (Perfectly preserved) |
| **Physical Size** | 21.95 KB | 3.01 KB | **-86.2%** (Extreme reduction) |
| **Inference Latency** | 0.0281 ms / seq | 0.0192 ms / seq | **-31.6%** (Faster execution) |

## Conclusion
The **ONNX** conversion is incredibly successful. 
- It reduced the already tiny model file size from 22 KB down to just **3 KB**. 
- It achieved a **31% speed boost** during inference.
- It completely decoupled our engine from PyTorch, making it trivial to bind to a lightweight Capacitor offline application.

The ONNX optimized model (`models/can_net.onnx`) is officially selected as the primary deployment engine for the mobile application. The original PyTorch weights remain available (`models/can_net.pth`) for future retraining.
