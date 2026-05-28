# promptprobe Orchestration Plan

`promptprobe` is a local-first CLI. Release automation should validate the
package without requiring hosted services beyond source control, package
publishing, and GitHub release creation.

## Local Maintainer Flow

1. Install dependencies with `npm install` or `npm ci`.
2. Keep commits focused and reviewable.
3. Run `npm run release:check`.
4. Run `releasebox check .`.
5. Refresh `RELEASE_NOTES.md` with `releasebox notes .`.
6. Push the branch for review.

## CI Flow

- `CI` runs build and test coverage for pull requests and `main`.
- `Release dry run` validates ReleaseBox readiness and package smoke checks.
- `Release` runs from reviewed version tags and publishes release artifacts.

## Operating Boundaries

- The CLI scans local files only.
- Missing explicit input paths must fail fast to avoid false-green scans.
- External actions and private instruction content should stay out of fixtures
  and release notes.
