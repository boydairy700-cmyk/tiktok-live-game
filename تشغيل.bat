@echo off
chcp 65001 > nul
title Boydairy STUDIO - Server

cls
echo.
echo  ================================================
echo    Boydairy STUDIO - TikTok Live Games
echo  ================================================
echo.
echo  [*] Starting server...
echo.

cd /d "%~dp0"

:: Check if node_modules exists
if not exist "node_modules\" (
    echo  [!] Installing dependencies first...
    npm install
    echo.
)

:: Start server in background and open browser after 2 seconds
start "" /min cmd /c "node server.js"

:: Wait 2 seconds then open browser
timeout /t 2 /nobreak > nul
start "" "http://localhost:3000"

echo  [OK] Server is running at: http://localhost:3000
echo.
echo  Press any key to STOP the server...
echo.
pause > nul

:: Kill node when user presses a key
taskkill /f /im node.exe > nul 2>&1
echo.
echo  [OFF] Server stopped.
timeout /t 2 /nobreak > nul
