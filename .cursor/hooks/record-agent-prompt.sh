#!/usr/bin/env bash
# Captures user prompts submitted to the agent for Engagement → Logs.
set -euo pipefail

root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
node "$root/scripts/record-agent-prompt.cjs" || true
printf '%s\n' '{}'
exit 0
