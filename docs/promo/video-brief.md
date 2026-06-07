# Video Brief: Lint an AGENTS.md Before Sharing It

## Grounded Product Facts

- PromptProbe scans Markdown and text files offline.
- It reports instruction hygiene findings with rule ids, severities, locations, excerpts, and hints.
- Current rules cover ambiguous authority, unsafe external actions, missing privacy boundaries, brittle absolute paths, and common direct contradictions.
- Output formats are text, JSON, and Markdown.
- `scan` exits `2` when findings meet or exceed the configured threshold.

## 60-Second Flow

1. Show `examples/risky-agent-instructions.md`.
2. Run:

   ```bash
   npm run build
   node dist/src/cli.js scan examples/risky-agent-instructions.md --format markdown --output /tmp/promptprobe-risky.md
   ```

3. Open `/tmp/promptprobe-risky.md` and show the rule ids and hints.
4. Run the safer example:

   ```bash
   node dist/src/cli.js scan examples/safer-agent-instructions.md --format markdown --output /tmp/promptprobe-safer.md
   ```

5. Show `node dist/src/cli.js explain PP003` for a focused rule explanation.

## Avoid Claiming

- Do not claim semantic proof of prompt safety.
- Do not claim policy enforcement outside the scanned files.
- Do not claim model-specific jailbreak detection.
