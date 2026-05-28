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
promptprobe --version
```

By default, `scan` exits `2` when findings at or above the configured `failOn` severity are present. The default threshold is `high`.
When you pass explicit file paths, missing files are treated as errors so typos do not produce empty successful scans.

See [examples/agent-instructions.md](examples/agent-instructions.md) for a minimal instruction file that should pass the default rules.

## Verify

Run the local validation script before opening a pull request:

```sh
bash scripts/validate.sh
```

`scripts/validate.sh` runs the repository's standard local checks when they are defined and will also run `agent-qc ready` when `agent-qc` is installed. Missing `agent-qc` is treated as a skip, not a failure.

For release readiness, run:

```sh
npm run release:check
```

`release:check` type-checks, runs tests, exercises the CLI smoke test, verifies package entrypoints, and performs an npm pack dry run.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution expectations. Changes
should be small, reviewable, and verified before review.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting guidance. Replace
the default security policy before publishing the generated repository.

These links assume this README has been copied to the generated repository root.

## License

MIT
