@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0HQTD_UPDATE.ps1"
if errorlevel 1 (
  echo.
  echo Update failed. Please keep this window and check the error above.
  pause
  exit /b 1
)
del /f /q "%~dp0HQTD_UPDATE.ps1" >nul 2>&1
echo.
echo Website update applied successfully.
echo Open GitHub Desktop and review Changes, then Commit to main and Push origin.
pause
start "" /b cmd /c "timeout /t 1 >nul & del /f /q \"%~f0\""
exit /b 0
