@echo off
title Findora Backend (Spring Boot - JDK 17)

rem ====================================================
rem  Force JDK 17 - fixes Lombok compatibility error
rem ====================================================
if exist "C:\Program Files\Java\jdk-17" (
    set "JAVA_HOME=C:\Program Files\Java\jdk-17"
    set "PATH=C:\Program Files\Java\jdk-17\bin;%PATH%"
    echo [Java Version]
    "C:\Program Files\Java\jdk-17\bin\java.exe" -version
) else (
    echo [WARNING] C:\Program Files\Java\jdk-17 not found. Trying to run with system default Java.
)
echo.

rem Go to project directory (same folder as this bat file)
cd /d "%~dp0"

echo [Starting] Spring Boot on http://localhost:8080 ...
echo.
powershell -NoProfile -Command "if (Test-Path 'C:\Program Files\Java\jdk-17') { $env:JAVA_HOME='C:\Program Files\Java\jdk-17'; $env:PATH='C:\Program Files\Java\jdk-17\bin;' + $env:PATH } else { Write-Host 'Warning: C:\Program Files\Java\jdk-17 not found. Running with system default Java.' }; .\mvnw.cmd spring-boot:run"

pause
