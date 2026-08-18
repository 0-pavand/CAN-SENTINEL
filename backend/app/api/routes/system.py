from fastapi import APIRouter
from app.api.schemas import SystemHealthResponse
import os

router = APIRouter()

@router.get("/health", response_model=SystemHealthResponse)
def get_health():
    models = {}
    
    # Check if ONNX model exists
    onnx_path = "models/can_net.onnx"
    if os.path.exists(onnx_path):
        models["onnx_model"] = "available"
    else:
        models["onnx_model"] = "missing"
        
    return SystemHealthResponse(
        status="ok",
        version="1.0.0",
        mode="offline",
        models=models
    )
