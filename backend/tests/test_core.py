from app.core.config import settings
from app.core.logger import get_logger
from app.core.errors import AppError

def test_settings_defaults():
    assert settings.app_name == "CAN Anomaly Detector"
    assert settings.log_level in ["INFO", "DEBUG", "WARNING", "ERROR"]

def test_logger_creation():
    logger = get_logger("test_logger")
    assert logger.name == "test_logger"
    assert logger.level > 0

def test_error_hierarchy():
    error = AppError("Test error")
    assert isinstance(error, Exception)
    assert str(error) == "Test error"
