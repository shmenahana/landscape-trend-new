# Fili Content Automation - Windows Task Scheduler Setup
# Run this PowerShell script as Administrator to set up automated content generation

$ErrorActionPreference = "Stop"

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RunScript = Join-Path $ScriptDir "run_automation.bat"

Write-Host "Setting up Fili Content Automation Windows Task..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Script location: $ScriptDir"
Write-Host "Run script: $RunScript"
Write-Host ""

# Check if run script exists
if (!(Test-Path $RunScript)) {
    Write-Host "ERROR: run_automation.bat not found at $RunScript" -ForegroundColor Red
    exit 1
}

# Task configuration
$TaskName = "FiliContentAutomation"
$TaskDescription = "Automated content generation for Fili Property Maintenance"

# Schedule: Every Monday at 9:00 AM
$Trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 9:00AM

# Action: Run the batch script
$Action = New-ScheduledTaskAction -Execute $RunScript -WorkingDirectory $ScriptDir

# Settings
$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable

# Check if task already exists
$ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if ($ExistingTask) {
    Write-Host "WARNING: Task '$TaskName' already exists." -ForegroundColor Yellow
    $response = Read-Host "Do you want to replace it? (y/n)"
    if ($response -ne 'y') {
        Write-Host "Cancelled. No changes made." -ForegroundColor Yellow
        exit 0
    }
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Existing task removed." -ForegroundColor Green
}

# Create the scheduled task
Register-ScheduledTask `
    -TaskName $TaskName `
    -Description $TaskDescription `
    -Trigger $Trigger `
    -Action $Action `
    -Settings $Settings

Write-Host ""
Write-Host "✓ Scheduled Task created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Task Name: $TaskName"
Write-Host "Schedule: Every Monday at 9:00 AM"
Write-Host ""
Write-Host "To view: Open Task Scheduler (taskschd.msc)"
Write-Host "To edit: Task Scheduler > Task Scheduler Library > $TaskName"
Write-Host "To run manually: Right-click task > Run"
Write-Host "To disable: Right-click task > Disable"
Write-Host ""
Write-Host "Customize schedule in Task Scheduler:" -ForegroundColor Cyan
Write-Host "  - Every Wednesday at 9am"
Write-Host "  - Every day at 2pm"
Write-Host "  - Twice a week (Mon + Thu)"
Write-Host ""
Write-Host "Log file: $ScriptDir\logs\automation_runs.log"
