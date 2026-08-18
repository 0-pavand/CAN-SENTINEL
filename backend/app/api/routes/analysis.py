from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional
import os
import shutil
from app.api.schemas import AnalysisStartRequest, JobStatusResponse, AnalysisResultResponse, AnalysisMode
from app.services.analysis_service import analysis_service

router = APIRouter()

UPLOAD_DIR = "data/uploads"

@router.post("/upload")
async def upload_log_file(file: UploadFile = File(...)):
    """
    Upload a CAN log file for analysis.
    """
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)
        
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"message": "File uploaded successfully", "filepath": file_path}

@router.post("/start", response_model=JobStatusResponse)
async def start_analysis(request: AnalysisStartRequest):
    """
    Start an analysis job in the background.
    """
    if not os.path.exists(request.filepath):
        raise HTTPException(status_code=404, detail="Log file not found")
        
    if not os.path.exists(request.dbc_path):
        raise HTTPException(status_code=404, detail="DBC file not found")
        
    job_id = await analysis_service.start_analysis(request.dict())
    
    status = analysis_service.get_job_status(job_id)
    return status

@router.get("/job/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """
    Get the status of an ongoing analysis job.
    """
    status = analysis_service.get_job_status(job_id)
    if not status:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return status

@router.get("/job/{job_id}/results", response_model=AnalysisResultResponse)
async def get_job_results(job_id: str):
    """
    Get the results of a completed analysis job.
    """
    status = analysis_service.get_job_status(job_id)
    if not status:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if status.status not in ["complete", "failed"]:
        raise HTTPException(status_code=400, detail="Job not yet complete")
        
    results = analysis_service.get_job_results(job_id)
    if not results:
        raise HTTPException(status_code=404, detail="Results not found")
        
    return results
