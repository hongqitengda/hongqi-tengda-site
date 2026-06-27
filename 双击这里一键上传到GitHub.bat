@echo off
setlocal
set "TMPPS=%TEMP%\hqt-deploy-%RANDOM%-%RANDOM%.ps1"
copy /Y "%~dp0deploy.ps1" "%TMPPS%" >nul
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%TMPPS%" -PackageDir "%~dp0"
set "ERR=%ERRORLEVEL%"
del /Q "%TMPPS%" >nul 2>&1
exit /b %ERR%
