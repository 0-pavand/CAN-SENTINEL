import pytest
import subprocess
import os

def test_cli_status():
    result = subprocess.run(
        ["python", "scripts/cli.py", "status"],
        capture_output=True,
        text=True
    )
    assert result.returncode == 0
    assert "OK" in result.stdout

def test_cli_analyze():
    # Only run this if we have the actual files
    if os.path.exists("../data/CAN.log") and os.path.exists("../data/CAN.dbc"):
        result = subprocess.run(
            ["python", "scripts/cli.py", "analyze", "--log", "../data/CAN.log", "--dbc", "../data/CAN.dbc"],
            capture_output=True,
            text=True
        )
        assert result.returncode == 0
        assert "ANALYSIS COMPLETE" in result.stdout
        assert "Frames processed:" in result.stdout
