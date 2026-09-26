@echo off
where py >nul 2>nul
if %errorlevel%==0 (py "%~dp0trainer.py" %*) else (python "%~dp0trainer.py" %*)
pause
