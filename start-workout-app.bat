@echo off
title Workout App Launcher
echo Starting Workout App...
echo.

REM Change to the workout app directory
cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Start the app
echo Launching Workout App...
echo Close this window to stop the app.
echo.
call npm start

REM Keep window open if there's an error
if errorlevel 1 (
    echo.
    echo An error occurred. Press any key to close...
    pause >nul
)