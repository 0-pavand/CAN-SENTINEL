import os
import time
import numpy as np
import tracemalloc
from app.ml.inference import ModelPredictor, OnnxPredictor

def benchmark(model_type: str, predictor, X_test: np.ndarray, y_test: np.ndarray):
    print(f"\n--- Benchmarking {model_type} ---")
    # Accuracy pass
    correct = 0
    total = len(X_test)
    
    # We pass 'raw' sequence to predict, but we only have numpy array here.
    # We should adapt the predictors to accept numpy or we just feed dummy raw.
    # Actually, predictor.predict expects List[Dict]. 
    # Let's bypass preprocessing for benchmarking speed.
    
    # We will measure just the model execution.
    if model_type == "PyTorch":
        import torch
        X_tensor = torch.FloatTensor(X_test).to(predictor.device)
        
        tracemalloc.start()
        start = time.perf_counter()
        with torch.no_grad():
            for i in range(100): # 100 passes for stable avg
                logits = predictor.model(X_tensor)
        end = time.perf_counter()
        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        
        with torch.no_grad():
            logits = predictor.model(X_tensor).squeeze(-1)
            probs = torch.sigmoid(logits).cpu().numpy()
            
    else:
        # ONNX
        X_np = X_test.astype(np.float32)
        
        tracemalloc.start()
        start = time.perf_counter()
        # The ONNX model was exported with batch_size=1
        for i in range(100):
            for j in range(total):
                logits = predictor.session.run(None, {predictor.input_name: X_np[j:j+1]})[0]
        end = time.perf_counter()
        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        
        logits_list = []
        for j in range(total):
            l = predictor.session.run(None, {predictor.input_name: X_np[j:j+1]})[0]
            logits_list.append(l[0][0])
            
        probs = 1 / (1 + np.exp(-np.array(logits_list)))

    preds = (probs >= 0.5).astype(int)
    accuracy = np.mean(preds == y_test)
    
    avg_latency = ((end - start) / (100 * total)) * 1000 # ms per sequence
    peak_mem_mb = peak / 10**6
    
    print(f"Accuracy: {accuracy:.4f}")
    print(f"Latency:  {avg_latency:.4f} ms/sequence")
    print(f"Peak Mem: {peak_mem_mb:.4f} MB")
    
    return accuracy, avg_latency, peak_mem_mb

if __name__ == "__main__":
    dataset_path = "../data/ml_dataset.npz"
    data = np.load(dataset_path)
    X_test, y_test = data['X_test'], data['y_test']
    
    pytorch_path = "models/can_net.pth"
    onnx_path = "models/can_net.onnx"
    quant_path = "models/can_net_quantized.onnx"
    config_path = "../data/scaler_config.json"
    
    print(f"Loading {len(X_test)} test sequences...")
    
    # 1. PyTorch
    pt_pred = ModelPredictor(pytorch_path, config_path)
    pt_acc, pt_lat, pt_mem = benchmark("PyTorch", pt_pred, X_test, y_test)
    
    # 2. ONNX FP32
    onnx_pred = OnnxPredictor(onnx_path, config_path)
    ox_acc, ox_lat, ox_mem = benchmark("ONNX (FP32)", onnx_pred, X_test, y_test)
    
    # 3. ONNX Quantized
    if os.path.exists(quant_path):
        quant_pred = OnnxPredictor(quant_path, config_path)
        qu_acc, qu_lat, qu_mem = benchmark("ONNX (Int8 Quantized)", quant_pred, X_test, y_test)
        qu_size = os.path.getsize(quant_path) / 1024
    else:
        print("ONNX Quantized model not found, skipping benchmark.")
        qu_size = 0.0
    
    # File sizes
    pt_size = os.path.getsize(pytorch_path) / 1024
    ox_size = os.path.getsize(onnx_path) / 1024
    
    print("\n=== SUMMARY ===")
    print(f"PyTorch Size: {pt_size:.2f} KB")
    print(f"ONNX Size:    {ox_size:.2f} KB")
    if qu_size > 0:
        print(f"Quant Size:   {qu_size:.2f} KB")
