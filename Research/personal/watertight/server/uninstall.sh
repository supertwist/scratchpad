#!/usr/bin/env bash
# Remove the Watertight launchd service. Leaves the code and logs in place.
set -euo pipefail
LABEL="edu.gwu.corcoran.watertight"
UID_NUM="$(id -u)"

launchctl bootout "gui/$UID_NUM/$LABEL" 2>/dev/null && echo "stopped $LABEL" || echo "$LABEL was not running"
rm -f "$HOME/Library/LaunchAgents/$LABEL.plist" && echo "removed the LaunchAgent"

echo
echo "Left alone (delete by hand if you want them gone):"
echo "  code + venv : $(cd "$(dirname "$0")" && pwd)"
echo "  logs        : $HOME/Library/Logs/Watertight"
