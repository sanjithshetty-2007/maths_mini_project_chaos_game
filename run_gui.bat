@echo off
rem Opens the Project 10 GUI.
rem 1. Finds Python ("py" launcher first, then "python").
rem 2. Installs numpy and matplotlib if they are missing.
rem 3. Starts lab10_gui.py.
setlocal
cd /d "%~dp0"

rem ---- 1. Find a working Python ----
set "PY="
py --version >nul 2>nul && set "PY=py"
if not defined PY (
    python --version >nul 2>nul && set "PY=python"
)
if not defined PY (
    echo Python is not installed on this computer.
    echo.
    echo Install it from https://www.python.org/downloads/
    echo During setup, tick "Add python.exe to PATH".
    echo Then double-click run_gui.bat again.
    echo.
    pause
    exit /b 1
)

rem ---- 2. Make sure the libraries are there ----
%PY% -c "import tkinter" >nul 2>nul
if errorlevel 1 (
    echo This Python does not include Tkinter, which the window needs.
    echo Reinstall Python from https://www.python.org/downloads/
    echo and keep "tcl/tk and IDLE" ticked in the setup options.
    echo.
    pause
    exit /b 1
)

%PY% -c "import numpy, matplotlib" >nul 2>nul
if errorlevel 1 (
    echo Installing numpy and matplotlib - this happens only once...
    echo.
    %PY% -m pip install -r requirements.txt
    %PY% -c "import numpy, matplotlib" >nul 2>nul
    if errorlevel 1 (
        echo.
        echo Could not install numpy and matplotlib automatically.
        echo Check your internet connection, then try again, or run:
        echo     %PY% -m pip install -r requirements.txt
        echo.
        pause
        exit /b 1
    )
)

rem ---- 3. Start the GUI ----
echo Opening the Project 10 window...
%PY% lab10_gui.py
if errorlevel 1 (
    echo.
    echo The window closed with an error - see the message above.
    pause
)
