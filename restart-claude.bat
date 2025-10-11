@echo off
echo Restarting Claude Desktop...
echo.

REM Kill any running Claude processes
taskkill /F /IM claude.exe /T 2>nul
if %errorlevel% == 0 (
    echo Claude Desktop processes terminated.
) else (
    echo No Claude Desktop processes found running.
)

echo Waiting 2 seconds...
timeout /t 2 /nobreak >nul

REM Try to start Claude Desktop from common installation paths
if exist "%LOCALAPPDATA%\Programs\Claude\Claude.exe" (
    start "" "%LOCALAPPDATA%\Programs\Claude\Claude.exe"
    echo Claude Desktop restarted!
) else if exist "%ProgramFiles%\Claude\Claude.exe" (
    start "" "%ProgramFiles%\Claude\Claude.exe"
    echo Claude Desktop restarted!
) else if exist "%ProgramFiles(x86)%\Claude\Claude.exe" (
    start "" "%ProgramFiles(x86)%\Claude\exe"
    echo Claude Desktop restarted!
) else (
    echo.
    echo Could not find Claude Desktop executable.
    echo Please start Claude Desktop manually from the Start menu.
)

echo.
pause

