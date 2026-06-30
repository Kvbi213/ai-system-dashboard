@echo off
title AI System Dashboard - Startup
echo ==============================================
echo       AI SYSTEM DASHBOARD - STARTUP SCRIPT
echo ==============================================

REM Sprawdzamy czy node.js jest zainstalowany
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [!] BLAD: Node.js nie jest zainstalowany! 
    echo Pobierz i zainstaluj z: https://nodejs.org/
    pause
    exit /b
)

REM Sprawdzamy czy zaleznosci sa zainstalowane
IF NOT EXIST "node_modules\" (
    echo [*] Rozpoczynam instalacje zaleznosci (npm install)...
    echo [*] To moze potrwac kilka minut.
    call npm install
    IF %ERRORLEVEL% NEQ 0 (
        echo [!] Blad podczas instalacji zaleznosci.
        pause
        exit /b
    )
    echo [+] Instalacja zakonczona sukcesem.
    echo.
)

REM Sprawdzamy czy plik .env istnieje, jak nie, tworzymy pusty by uniknac bledow
IF NOT EXIST ".env" (
    echo. > .env
    echo [*] Utworzono pusty plik .env
)

REM Uruchamiamy aplikacje
echo [*] Uruchamianie Systemu...
echo [*] Backend: Port 5000
echo [*] Frontend: http://localhost:5173
echo.
echo Aby zatrzymac system, wcisnij CTRL+C.
echo ==============================================

call npm run start
pause
