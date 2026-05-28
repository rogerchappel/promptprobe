# promptprobe Release Tasks

Use this checklist for every release candidate before tagging or publishing.

## Required Checks

- Install dependencies with `npm install` or `npm ci`.
- Run `npm run release:check`.
- Run `releasebox check .` when ReleaseBox is available.
- Refresh `RELEASE_NOTES.md` with `releasebox notes .`.
- Review `npm pack --dry-run` output for package contents.

## Manual Review

- Confirm scan examples still match the CLI help output.
- Confirm missing explicit scan inputs fail fast.
- Confirm rule descriptions and explanation output remain consistent.
- Confirm no private prompt or instruction content is checked into fixtures.

## Tagging

- Do not tag until all required checks pass.
- Push the factory branch for review before creating a release.
- Update release links after the first version tag exists.
