# Claude Code Notifications Setup

This project has been configured with Claude Code notification hooks to alert you when Claude needs your attention.

## What Was Installed

### 1. Notification Script
**Location:** `~/.config/claude/scripts/notify.sh`

A smart notification script that:
- Uses desktop notifications (notify-send) when available
- Falls back to terminal bell + echo if notify-send is not installed
- Extracts relevant information from Claude Code's transcript
- Displays the last assistant message in the notification

### 2. Claude Code Hook Configuration
**Location:** `~/.config/claude/settings.json`

Configured to run the notification script whenever Claude Code needs your attention (idle for 60+ seconds or waiting for permission).

## How It Works

When Claude Code:
- Needs permission to use a tool
- Has been idle waiting for input for at least 60 seconds

The notification hook will trigger and send you an alert with:
- Session name
- Last message from Claude
- Visual and/or audio notification

## Current Status

✓ Configuration files created
✓ Notification script installed and tested
✓ Hooks configured in settings.json
⚠ Desktop notifications require `libnotify-bin` (pending network connectivity)

## To Enable Desktop Notifications

When your network connection is available, install notify-send:

```bash
sudo apt-get update
sudo apt-get install libnotify-bin
```

After installation, desktop notifications will automatically work - no additional configuration needed!

## Testing

To test the notification system manually:

```bash
echo '{"transcript_path": "/tmp/test.json", "session_id": "test"}' | ~/.config/claude/scripts/notify.sh
```

## Customization

You can customize the notification script at `~/.config/claude/scripts/notify.sh` to:
- Change notification duration/urgency
- Add sound effects
- Integrate with other notification systems (Slack, Discord, etc.)
- Filter which messages trigger notifications

## Resources

Based on best practices from:
- [Claude Code Hooks Guide](https://code.claude.com/docs/en/hooks-guide)
- [DataCamp Claude Code Hooks Tutorial](https://www.datacamp.com/tutorial/claude-code-hooks)
- Multiple community guides from 2026

## Additional Hook Ideas

You can extend your hooks configuration to:
- Run linters before code execution
- Automatically format code
- Run tests after file modifications
- Send notifications to Slack/Discord
- Log all Claude Code activity

---

**Setup Date:** 2026-01-22
**Status:** Active (using fallback notifications until notify-send is installed)
