@echo off
echo Starting Biomass Estimation Backend Server...
echo.

cd /d "%~dp0backend"

REM Check if venv exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate venv
call venv\Scripts\activate.bat

REM Install requirements
echo Installing dependencies...
pip install -r requirements.txt -q

REM Start server
echo.
echo Starting FastAPI server on http://localhost:8000
echo.
python app.py
