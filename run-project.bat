@echo off
title Findora - Full Stack Launcher
cd /d "%~dp0"

echo ============================================
echo   Findora AI - Lost and Found Platform
echo ============================================
echo.

rem ---- Start Backend (JDK 17 path check + fallback) ----
echo [STARTING] Backend on http://localhost:8080 ...
start "Backend - Spring Boot" powershell -NoExit -Command "if (Test-Path 'C:\Program Files\Java\jdk-17') { $env:JAVA_HOME='C:\Program Files\Java\jdk-17'; $env:PATH='C:\Program Files\Java\jdk-17\bin;' + $env:PATH } else { Write-Host 'Warning: C:\Program Files\Java\jdk-17 not found. Trying to run with system default Java.' }; Set-Location '%~dp0'; .\mvnw.cmd spring-boot:run"

rem ---- Detect Local IP Address for LAN Access (must be done before starting frontend) ----
set "LOCAL_IP="
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Get-NetIPAddress | Where-Object { $_.AddressFamily -eq 'IPv4' -and $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1).IPAddress"`) do set "LOCAL_IP=%%i"

if not "%LOCAL_IP%"=="" (
    echo BACKEND_HOST=%LOCAL_IP% > "%~dp0findora-frontend\.env.local"
) else (
    if exist "%~dp0findora-frontend\.env.local" del "%~dp0findora-frontend\.env.local"
)

rem ---- Start Frontend (Install dependencies if missing) ----
echo [STARTING] Frontend on http://localhost:3000 ...
if not exist "%~dp0findora-frontend\node_modules\" (
    echo [INFO] node_modules not found. Installing frontend dependencies...
    cmd /c "cd /d "%~dp0findora-frontend" && npm install"
)
start "Frontend - Next.js" cmd /k "cd /d "%~dp0findora-frontend" && npm run dev"

echo.
echo ===================================================
echo   Local Access:
echo     Backend  : http://localhost:8080
echo     Frontend : http://localhost:3000
echo.
if not "%LOCAL_IP%"=="" (
echo   Same Network - Wi-Fi Access:
echo     Frontend : http://%LOCAL_IP%:3000
) else (
echo   Same Network - Wi-Fi Access:
echo     Could not auto-detect local IP. Ensure you are
echo     connected to Wi-Fi/Ethernet.
)
echo ===================================================
echo.
echo Done! Two windows opened.
echo Close this window anytime.
pause
