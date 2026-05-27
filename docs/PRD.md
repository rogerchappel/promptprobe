# promptprobe PRD

Status: in-progress

## Summary

`promptprobe` is an offline linter for agent instructions, system prompts, and repo guidance files. It scans Markdown/text for ambiguous authority, unsafe external actions, missing privacy boundaries, brittle absolute paths, and conflicting rules, then emits actionable findings with stable codes.

## Source attribution

Inspired by AGENTS.md standardization, MCP safety discussions, and behavior-testing research for AI coding agents. This project is a static local checker for instruction hygiene rather than a model evaluator.

## Problem

Agent instruction files are now operational configuration. Small contradictions such as "push directly" plus "never publish" or missing privacy boundaries can cause real workflow failures. Most teams review these files manually.

## Users

- Developers maintaining AGENTS.md, CLAUDE.md, Codex instructions, and skill files.
- Teams onboarding agentic workflows.
- OSS maintainers who want safer contributor-agent docs.

## V1 Goals

- Scan Markdown and plain text files.
- Ship a built-in rule set with stable IDs and severities.
- Support `.promptprobe.json` config for ignored rules and custom globs.
- Output text, JSON, and Markdown reports.
- Provide `init`, `scan`, `explain`, and `rules` commands.
- Include fixture-backed tests for conflicting rules and privacy gaps.

## Non-Goals

- Calling LLMs to judge prompts.
- Blocking all risky instructions.
- Parsing every proprietary prompt format.

## CLI

```bash
promptprobe init
promptprobe scan AGENTS.md skills/**/*.md
promptprobe scan --format json --output promptprobe.json
promptprobe explain PP003
```

## Acceptance Criteria

- Works offline and deterministically.
- Exits non-zero on high-severity findings by default.
- Findings include file, line, rule ID, severity, and fix hint.
- README has examples for repository and personal-agent workspaces.
