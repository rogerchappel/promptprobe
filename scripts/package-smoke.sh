#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

cd "$repo_root"
package_path="$(npm pack --silent --pack-destination "$tmp_dir")"
package_path="$tmp_dir/$package_path"

mkdir "$tmp_dir/consumer"
cd "$tmp_dir/consumer"
npm init --yes --silent >/dev/null
npm install --offline --ignore-scripts "$package_path"

./node_modules/.bin/promptprobe rules >/dev/null
npx --no-install promptprobe explain PP003 >/dev/null
node --input-type=module -e 'import assert from "node:assert/strict"; import { scan, rules } from "promptprobe"; assert.equal(typeof scan, "function"); assert.ok(rules.length > 0);'
printf '# Instructions\n' > "$tmp_dir/AGENTS.md"
scan_status=0
./node_modules/.bin/promptprobe scan --format json --output "$tmp_dir/report.json" "$tmp_dir/AGENTS.md" || scan_status=$?
test "$scan_status" -eq 0 -o "$scan_status" -eq 2
node --input-type=module -e 'import assert from "node:assert/strict"; import { readFileSync } from "node:fs"; const report = JSON.parse(readFileSync(process.argv[1], "utf8")); assert.ok(Array.isArray(report.findings));' "$tmp_dir/report.json"
printf 'installed package smoke passed: %s\n' "$(basename "$package_path")"
