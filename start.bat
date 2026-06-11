@echo off
title Kirloskar Chiller Selection Tool
echo ================================================
echo   Kirloskar Chiller Selection Tool
echo   Starting server...
echo ================================================
echo.

cd /d "%~dp0backend"

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH.
    echo Please install Python from https://python.org
    pause
    exit /b 1
)

:: Install dependencies if needed
echo Checking dependencies...
pip install flask flask-cors pywin32 --quiet

echo.
echo Server started! Opening browser...
echo.
echo Access the app at: http://localhost:5000
echo Press Ctrl+C to stop the server.
echo.

:: Open browser after 2 seconds
start /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:5000"

:: Start Flask
python app.py

pause
