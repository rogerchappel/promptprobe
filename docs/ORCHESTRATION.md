# PromptProbe Orchestration

## Local Checks

Run these commands before release or packaging changes:

```sh
npm install
npm run release:check
```

## Release Dry Run

The release dry-run workflow installs dependencies, runs ReleaseBox readiness checks, executes `npm run release:check`, and renders a release notes preview for review.
