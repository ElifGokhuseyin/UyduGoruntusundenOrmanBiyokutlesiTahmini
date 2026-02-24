@echo off
echo Starting Biomass Estimation Frontend...
echo.

cd /d "%~dp0frontend"

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

REM Start dev server
echo.
echo Starting React development server on http://localhost:3000
echo.
npm run dev
