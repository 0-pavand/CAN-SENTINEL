import os
from pydantic import BaseModel, Field

class Settings(BaseModel):
    app_name: str = "CAN Anomaly Detector"
    log_level: str = Field(default_factory=lambda: os.getenv("LOG_LEVEL", "INFO"))
    dbc_file_path: str = Field(default_factory=lambda: os.getenv("DBC_FILE_PATH", "data/CAN.dbc"))
    
settings = Settings()
