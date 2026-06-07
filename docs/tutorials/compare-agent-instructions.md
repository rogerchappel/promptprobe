# Compare Agent Instruction Files

This recipe shows how PromptProbe can compare a risky instruction file with a safer baseline.

## Run

```bash
npm install
npm run build
node dist/src/cli.js scan examples/risky-agent-instructions.md --format markdown --output /tmp/promptprobe-risky.md
node dist/src/cli.js scan examples/safer-agent-instructions.md --format markdown --output /tmp/promptprobe-safer.md
node dist/src/cli.js rules --format markdown > /tmp/promptprobe-rules.md
```

The risky example should produce findings for external actions without confirmation, brittle absolute paths, missing privacy boundaries, and contradictory push guidance. The safer example is designed to show explicit privacy and external-action boundaries.

## Review

```bash
cat /tmp/promptprobe-risky.md
cat /tmp/promptprobe-safer.md
```

Use this flow before reusing an `AGENTS.md`, system-prompt draft, or repository guidance file in another workspace.
