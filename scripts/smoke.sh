#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

cat >"$tmp_dir/AGENTS.md" <<'EOF'
Push directly without asking.
Never push without confirmation.
EOF

set +e
node "$repo_root/dist/src/cli.js" scan "$tmp_dir/AGENTS.md" --output "$tmp_dir/report.txt"
status=$?
set -e

if [ "$status" -ne 2 ]; then
  printf 'expected scan to exit 2 for high-severity findings, got %s\n' "$status" >&2
  exit 1
fi

grep -q 'PP003' "$tmp_dir/report.txt"
grep -q 'PP005' "$tmp_dir/report.txt"
node "$repo_root/dist/src/cli.js" rules >/dev/null
node "$repo_root/dist/src/cli.js" explain PP003 >/dev/null

printf 'smoke passed\n'
