@echo off
REM LACVAY launcher — no Node.js install required, no admin password.
cd /d "%~dp0"

if not exist ".tools\node\node.exe" (
    echo Setting up portable Node.js...
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-node.ps1"
    if errorlevel 1 (
        echo Setup failed. See messages above.
        pause
        exit /b 1
    )
)

if not exist "node_modules\" (
    echo Installing dependencies (first time only)...
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
    if errorlevel 1 (
        echo Install failed. See messages above.
        pause
        exit /b 1
    )
)

echo.
echo Starting LACVAY...
echo   App:  http://localhost:5173
echo   API:  http://localhost:3001
echo   Press Ctrl+C to stop.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0dev.ps1"
