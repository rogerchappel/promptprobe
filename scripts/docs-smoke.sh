#!/usr/bin/env bash
set -euo pipefail

npm run build >/dev/null
cli=(node dist/src/cli.js)
"${cli[@]}" rules >/dev/null
"${cli[@]}" explain PP003 >/dev/null

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT
printf '# Instructions\n' > "$tmp_dir/AGENTS.md"
scan_status=0
"${cli[@]}" scan --format json --output "$tmp_dir/report.json" "$tmp_dir/AGENTS.md" || scan_status=$?
test "$scan_status" -eq 0 -o "$scan_status" -eq 2
test -s "$tmp_dir/report.json"

printf 'documented checkout commands passed\n'
