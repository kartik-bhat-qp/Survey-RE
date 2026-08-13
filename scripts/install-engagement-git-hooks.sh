#!/usr/bin/env bash
# Install git hooks that append Engagement → Logs entries on push/pull.
# Does not change git config — copies into the default .git/hooks path.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
hooks_dir="$root/.git/hooks"

if [[ ! -d "$hooks_dir" ]]; then
  echo "No .git/hooks directory found. Are you in a git repo?"
  exit 1
fi

cp "$root/scripts/githooks/pre-push" "$hooks_dir/pre-push"
cp "$root/scripts/githooks/post-merge" "$hooks_dir/post-merge"
chmod +x "$hooks_dir/pre-push" "$hooks_dir/post-merge"

echo "Installed Engagement git log hooks:"
echo "  $hooks_dir/pre-push"
echo "  $hooks_dir/post-merge"
