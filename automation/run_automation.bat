@echo off
REM Fili Content Automation - Windows Run Script
REM Usage: run_automation.bat [--topic "your topic"] [--review]

REM Change to automation directory
cd /d %~dp0

REM Activate virtual environment if it exists
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)

REM Run the automation
python fili_content_automation.py %*

REM Log completion
echo Automation completed at %date% %time% >> logs\automation_runs.log
