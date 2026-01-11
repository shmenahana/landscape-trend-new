#!/bin/bash
# Setup cron job for automated content generation
# This script adds a cron entry to run content automation weekly

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RUN_SCRIPT="$SCRIPT_DIR/run_automation.sh"

echo "Setting up Fili Content Automation cron job..."
echo ""
echo "Current script location: $SCRIPT_DIR"
echo "Run script: $RUN_SCRIPT"
echo ""

# Check if run script exists
if [ ! -f "$RUN_SCRIPT" ]; then
    echo "ERROR: run_automation.sh not found at $RUN_SCRIPT"
    exit 1
fi

# Make sure run script is executable
chmod +x "$RUN_SCRIPT"

# Proposed cron entry (runs every Monday at 9am)
CRON_ENTRY="0 9 * * 1 $RUN_SCRIPT >> $SCRIPT_DIR/logs/cron_output.log 2>&1"

echo "Proposed cron entry:"
echo "$CRON_ENTRY"
echo ""
echo "This will run the automation every Monday at 9:00 AM"
echo ""

# Check if cron entry already exists
if crontab -l 2>/dev/null | grep -q "$RUN_SCRIPT"; then
    echo "WARNING: A cron job for this script already exists."
    echo "Current crontab entries for this script:"
    crontab -l | grep "$RUN_SCRIPT"
    echo ""
    read -p "Do you want to replace it? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled. No changes made."
        exit 0
    fi
    # Remove existing entry
    crontab -l | grep -v "$RUN_SCRIPT" | crontab -
fi

# Add new cron entry
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

echo ""
echo "✓ Cron job added successfully!"
echo ""
echo "To verify, run: crontab -l"
echo "To edit manually, run: crontab -e"
echo "To remove, run: crontab -e (and delete the line)"
echo ""
echo "Customize schedule by editing this cron entry:"
echo "- 0 9 * * 1 = Every Monday at 9am"
echo "- 0 9 * * 3 = Every Wednesday at 9am"
echo "- 0 14 * * * = Every day at 2pm"
echo "- 0 9 */2 * * = Every 2 days at 9am"
echo ""
echo "Log file: $SCRIPT_DIR/logs/cron_output.log"
