#!/usr/bin/env bash
# Records Engagement → Logs entries after git push / pull in Cursor Agent shells.
set -euo pipefail

input="$(cat || true)"

command="$(printf '%s' "$input" | node -e '
  let raw = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => { raw += chunk; });
  process.stdin.on("end", () => {
    try {
      const data = JSON.parse(raw || "{}");
      process.stdout.write(String(data.command || ""));
    } catch {
      process.stdout.write("");
    }
  });
')"

# afterShellExecution expects no blocking payload
emit_ok() {
  printf '%s\n' '{}'
}

if [[ ! "$command" =~ git[[:space:]]+(push|pull)([[:space:]]|$) ]]; then
  emit_ok
  exit 0
fi

action="push"
if [[ "$command" =~ git[[:space:]]+pull ]]; then
  action="pull"
fi

root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
node "$root/scripts/record-git-activity.cjs" --action "$action" >/dev/null 2>&1 || true
emit_ok
exit 0
