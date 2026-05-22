@echo off
chcp 65001 > nul
title Boydairy STUDIO

cls
echo.
echo  =============================================
echo      Boydairy STUDIO - TikTok Live Games
echo  =============================================
echo.

cd /d "%~dp0"

:: Install dependencies if node_modules is missing
if not exist "node_modules\" (
    echo  [!] First time setup - installing packages...
    npm install
    echo.
)

:: Kill any previous node instance on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000"') do (
    taskkill /f /pid %%a > nul 2>&1
)

:: Start the server
echo  [*] Starting server...
start "" /b node server.js

:: Wait for server to be ready
timeout /t 2 /nobreak > nul

:: Open browser automatically
echo  [OK] Server running at http://localhost:3000
echo  [*] Opening browser...
start "" "http://localhost:3000"

echo.
echo  =============================================
echo   Server is ON - Press any key to STOP it
echo  =============================================
echo.
pause > nul

:: Stop server
taskkill /f /im node.exe > nul 2>&1
echo.
echo  [OFF] Server stopped. Goodbye!
timeout /t 2 /nobreak > nul
