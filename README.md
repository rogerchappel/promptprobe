# promptprobe

Offline linter for agent instructions, system prompts, and repository guidance files.

`promptprobe` scans Markdown and text for instruction-hygiene issues: ambiguous authority, unsafe external actions, missing privacy boundaries, brittle absolute paths, and direct contradictions.

## Status

This repository is early-stage. Confirm the current support, release, and
security posture before using it in production.

## Install

The package has not had its first npm release yet. Until `promptprobe` is available from npm,
clone the repository and use the development setup below.

## Use

```sh
node dist/src/cli.js scan AGENTS.md docs/**/*.md
node dist/src/cli.js scan --format json --output promptprobe.json
node dist/src/cli.js rules
node dist/src/cli.js explain PP003
```

After the first npm publication and a global install, replace `node dist/src/cli.js` with
`promptprobe` in the commands above.

By default, `scan` exits `2` when findings at or above the configured `failOn` severity are present. The default threshold is `high`.
When `--output` names a path in missing directories, `promptprobe` creates those parent directories
before writing the report. Output is not also printed to stdout, and finding-threshold exit codes are unchanged.

Command options are validated strictly. Unknown options, options without a value, and extra
arguments to `init`, `rules`, or `explain` print a diagnostic and exit `1`. Value options accept
both `--format json` and `--format=json` forms.

Every file or glob passed explicitly to `scan` must match at least one file. A typo such as
`promptprobe scan missing.md` prints a diagnostic and exits `1`, including when other inputs
match. Configured and built-in default globs may match no files; this lets `promptprobe scan`
succeed in a new repository that does not yet contain supported instruction files.

## Configuration

Create `.promptprobe.json` in the directory where you run the command. Every field is optional;
omitted fields use these defaults:

```json
{
  "files": ["AGENTS.md", "CLAUDE.md", "README.md", "docs/**/*.md", "skills/**/*.md", "**/*.prompt.md", "**/*.instructions.md"],
  "exclude": ["node_modules/**", "dist/**", "build/**", "coverage/**", ".git/**"],
  "ignoredRules": [],
  "failOn": "high",
  "format": "text"
}
```

`files`, `exclude`, and `ignoredRules` must be arrays of non-empty strings. `failOn` accepts
`low`, `medium`, or `high`; `format` accepts `text`, `json`, or `markdown`. Unknown keys and
invalid values print a field-specific diagnostic and exit `1`. An explicit `"files": []` means
scan no files; it does not restore the default file globs.

## Demo Recipes

- [Compare Agent Instruction Files](docs/tutorials/compare-agent-instructions.md) scans a risky example beside a safer baseline.
- [Video brief](docs/promo/video-brief.md) gives a grounded short walkthrough for explaining the tool.

## Verify

Run the local validation script before opening a pull request:

```sh
bash scripts/validate.sh
```

`scripts/validate.sh` runs the repository's standard local checks when they are defined and will also run `agent-qc ready` when `agent-qc` is installed. Missing `agent-qc` is treated as a skip, not a failure.

## Release readiness

Before opening a release PR, run the package checks that exercise the build, tests, smoke path, and pack manifest:

```sh
npm run check
npm test
npm run smoke
npm run package:smoke
npm run release:check
```

The package metadata points at the public GitHub repository so npm and generated provenance link back to the source.

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
npm ci
npm run build
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

The package smoke creates the publish tarball, installs it into a clean temporary consumer without
registry fallback, and invokes the installed `promptprobe` bin both directly and through `npx --no-install`.

## Limitations

promptprobe is a local-first helper for preparing reviewable evidence. It does not replace human review, live system validation, or project-specific policy checks, and generated output should be inspected before use in release or operational decisions.
