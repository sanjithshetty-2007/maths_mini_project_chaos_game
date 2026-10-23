@echo off
rem Starts the Project 10 presentation:
rem   1. the Python backend (api.py, FastAPI) on port 8000
rem   2. the Next.js website (web\) on port 3000
rem   3. opens http://localhost:3000 in your browser
rem Close both windows to stop it.
setlocal
cd /d "%~dp0"

rem ---- Python ----
set "PY="
py --version >nul 2>nul && set "PY=py"
if not defined PY (
    python --version >nul 2>nul && set "PY=python"
)
if not defined PY (
    echo Python is not installed. Get it from https://www.python.org/downloads/
    echo During setup, tick "Add python.exe to PATH".
    pause
    exit /b 1
)
%PY% -c "import numpy, matplotlib, fastapi, uvicorn" >nul 2>nul
if errorlevel 1 (
    echo Installing the Python libraries - this happens only once...
    %PY% -m pip install -r requirements.txt
    %PY% -c "import numpy, matplotlib, fastapi, uvicorn" >nul 2>nul
    if errorlevel 1 (
        echo Could not install the Python libraries. Check your internet connection.
        pause
        exit /b 1
    )
)

rem ---- Node.js ----
node --version >nul 2>nul
if errorlevel 1 (
    echo Node.js is not installed. Get the LTS version from https://nodejs.org/
    echo Then double-click start_presentation.bat again.
    pause
    exit /b 1
)

cd web
if not exist node_modules (
    echo Installing the website's packages - this happens only once...
    call npm install
    if errorlevel 1 ( pause & exit /b 1 )
)
if not exist .next\BUILD_ID (
    echo Building the website - this happens only once, about a minute...
    call npm run build
    if errorlevel 1 ( pause & exit /b 1 )
)
cd ..

rem ---- start ----
echo Starting the Python backend...
start "Project 10 - Python backend" /min %PY% -m uvicorn api:app --port 8000

echo Starting the website... it opens in your browser in a few seconds.
start "" /b cmd /c "ping -n 6 127.0.0.1 >nul & start http://localhost:3000"
cd web
call npm run start
