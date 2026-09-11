@echo off
rem ===========================================================================
rem  Unified Visual Reference Composer - one-click launcher for Windows.
rem
rem  Double-click this file. It starts a local web server and opens the app.
rem  Close this window, or press Ctrl+C, to stop it.
rem
rem  The app is plain ES modules, which browsers refuse to load from file://,
rem  so it has to be served. Node is preferred because tools\serve.mjs also
rem  finds a free port and opens the browser; Python is a fallback.
rem ===========================================================================

setlocal
chcp 65001 >nul 2>&1
title Unified Visual Reference Composer

rem Explorer launches double-clicked files from C:\Windows\System32, so move to
rem the folder this script lives in before touching any relative path.
cd /d "%~dp0"

if not exist "app\index.html" goto :wrongfolder

echo.
echo   Unified Visual Reference Composer
echo   =================================
echo.

where node >nul 2>nul
if %errorlevel% equ 0 goto :usenode

where py >nul 2>nul
if %errorlevel% equ 0 goto :usepylauncher

where python >nul 2>nul
if %errorlevel% equ 0 goto :usepython

goto :noruntime


:usenode
echo   Node.js 로 시작합니다.   [starting with Node.js]
echo   브라우저가 자동으로 열립니다. 이 창을 닫으면 종료됩니다.
echo.
node tools\serve.mjs --open
goto :stopped


:usepylauncher
set "PYCMD=py -3"
goto :runpython

:usepython
set "PYCMD=python"
goto :runpython

:runpython
echo   Python 으로 시작합니다.   [starting with Python]
echo   Node.js 가 있으면 더 매끄럽습니다:  https://nodejs.org/
echo.
echo   주소:  http://localhost:8765/app/index.html
echo   이 창을 닫으면 종료됩니다.
echo.
rem http.server has no free-port search, so 8765 must be free. If the app does
rem not open, another program is already using that port.
start "" "http://localhost:8765/app/index.html"
%PYCMD% -m http.server 8765
goto :stopped


:wrongfolder
echo.
echo   [X] app\index.html 을 찾을 수 없습니다.
echo       start.bat 이 프로젝트 폴더 안에 있어야 합니다.
echo       [start.bat must sit in the project folder]
goto :halt


:noruntime
echo   [X] Node.js 도 Python 도 찾을 수 없습니다.
echo       [neither Node.js nor Python was found]
echo.
echo   둘 중 하나를 설치한 뒤 다시 실행하세요:
echo.
echo       Node.js   https://nodejs.org/          (권장 / recommended)
echo       Python    https://www.python.org/downloads/
echo.
echo   설치할 때 "Add to PATH" 를 꼭 체크하세요.
goto :halt


:stopped
echo.
echo   서버를 종료했습니다.   [server stopped]

:halt
echo.
pause
endlocal
