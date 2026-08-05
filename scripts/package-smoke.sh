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
printf 'installed package smoke passed: %s\n' "$(basename "$package_path")"
