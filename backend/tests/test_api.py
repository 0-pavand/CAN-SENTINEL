from fastapi.testclient import TestClient
from app.api.main import app

client = TestClient(app)

def test_health():
    response = client.get("/api/system/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == "1.0.0"
    assert "onnx_model" in data["models"]

# Note: Integration tests for /api/analysis/upload, /api/analysis/start 
# would require mocking the file system and analysis service which is 
# beyond a simple unit test for this phase. The CLI command and manual 
# verification will validate the full flow.
