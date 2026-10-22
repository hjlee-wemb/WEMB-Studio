@echo off
rem WEMB Studio - double-click to run without internet (local server on http://localhost:5510/)
rem Keep the black window open while using the studio; close it to stop.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve-local.ps1"
