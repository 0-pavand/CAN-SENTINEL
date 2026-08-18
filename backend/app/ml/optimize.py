import torch
import os
import argparse
from app.ml.model import LightweightCanNet

def optimize_model(pth_path: str, output_onnx: str, num_features: int, sequence_length: int):
    print(f"Loading PyTorch model from {pth_path}...")
    device = torch.device("cpu") # ONNX export usually done on CPU
    model = LightweightCanNet(num_features, sequence_length).to(device)
    model.load_state_dict(torch.load(pth_path, map_location=device, weights_only=True))
    model.eval()
    
    # Dummy input matching the expected shape: (batch_size, sequence_length, num_features)
    dummy_input = torch.randn(1, sequence_length, num_features, device=device)
    
    # Export to ONNX
    print(f"Exporting to ONNX: {output_onnx}...")
    torch.onnx.export(
        model, 
        dummy_input, 
        output_onnx, 
        export_params=True, 
        opset_version=17, 
        do_constant_folding=True, 
        input_names=['input'], 
        output_names=['output']
    )
    print("Export successful.")
    
    # Quantization
    print("Running dynamic quantization (Int8)...")
    try:
        from onnxruntime.quantization import quantize_dynamic, QuantType
        
        quant_out = output_onnx.replace(".onnx", "_quantized.onnx")
        quantize_dynamic(
            model_input=output_onnx,
            model_output=quant_out,
            weight_type=QuantType.QUInt8
        )
        print(f"Quantized model saved to {quant_out}")
    except ImportError:
        print("onnxruntime not installed, skipping quantization.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Optimize PyTorch model for mobile deployment")
    parser.add_argument("--model", type=str, default="models/can_net.pth")
    parser.add_argument("--out", type=str, default="models/can_net.onnx")
    parser.add_argument("--features", type=int, default=66)
    parser.add_argument("--seq", type=int, default=16)
    args = parser.parse_args()
    
    optimize_model(args.model, args.out, args.features, args.seq)
