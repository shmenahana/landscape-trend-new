#!/bin/bash
# Fili Content Automation - Manual Run Script
# Usage: ./run_automation.sh [--topic "your topic"] [--review]

# Change to automation directory
cd "$(dirname "$0")"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Run the automation
python3 fili_content_automation.py "$@"

# Log completion
echo "Automation completed at $(date)" >> logs/automation_runs.log
