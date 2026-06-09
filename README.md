# promptprobe

Offline linter for agent instructions, system prompts, and repository guidance files.

`promptprobe` scans Markdown and text for instruction-hygiene issues: ambiguous authority, unsafe external actions, missing privacy boundaries, brittle absolute paths, and direct contradictions.

## Status

This repository is early-stage. Confirm the current support, release, and
security posture before using it in production.

## Install

```sh
npm install
npm run build
```

## Use

```sh
promptprobe scan AGENTS.md docs/**/*.md
promptprobe scan --format json --output promptprobe.json
promptprobe rules
promptprobe explain PP003
```

By default, `scan` exits `2` when findings at or above the configured `failOn` severity are present. The default threshold is `high`.

## Demo Recipes

- [Compare Agent Instruction Files](docs/tutorials/compare-agent-instructions.md) scans a risky example beside a safer baseline.
- [Video brief](docs/promo/video-brief.md) gives a grounded short walkthrough for explaining the tool.

## Verify

Run the local validation script before opening a pull request:

```sh
bash scripts/validate.sh
```

`scripts/validate.sh` runs the repository's standard local checks when they are defined and will also run `agent-qc ready` when `agent-qc` is installed. Missing `agent-qc` is treated as a skip, not a failure.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution expectations. Changes
should be small, reviewable, and verified before review.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting guidance. Replace
the default security policy before publishing the generated repository.

These links assume this README has been copied to the generated repository root.

## License

MIT

## Development

```sh
git clone https://github.com/rogerchappel/promptprobe.git
cd promptprobe
npm install
npm test
npm run smoke
npm run package:smoke
npm run release:check
```

## Release Readiness

Use the checked-in scripts before opening or publishing a release:

```sh
npm run check
npm test
npm run build
npm run smoke
npm run package:smoke
npm run release:check
```

The package smoke uses `npm pack --dry-run` so the published file list can be reviewed without publishing.
