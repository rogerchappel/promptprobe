#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { defaultConfig, loadConfig, writeDefaultConfig } from './config.js';
import { formatRules, formatScanResult } from './formatters.js';
import { getRule } from './rules.js';
import { hasFailingFindings, scan } from './scanner.js';
import type { OutputFormat, Severity } from './types.js';

type Parsed = {
  command: string;
  args: string[];
  options: Map<string, string | boolean>;
};

async function main(argv: string[]): Promise<number> {
  const parsed = parse(argv);
  try {
    if (parsed.command === 'init') {
      const destination = await writeDefaultConfig(process.cwd());
      process.stdout.write(`Created ${path.relative(process.cwd(), destination)}\n`);
      return 0;
    }

    if (parsed.command === 'rules') {
      process.stdout.write(formatRules(formatOption(parsed, 'format', 'text')));
      return 0;
    }

    if (parsed.command === 'explain') {
      const rule = getRule(parsed.args[0] ?? '');
      if (!rule) throw new Error('unknown rule id');
      process.stdout.write(`${rule.id} ${rule.title}\nSeverity: ${rule.severity}\nCategory: ${rule.category}\n\n${rule.description}\n\nHint: ${rule.hint}\n`);
      return 0;
    }

    if (parsed.command === 'scan') {
      const config = await loadConfig(process.cwd());
      const format = formatOption(parsed, 'format', config.format);
      const failOn = severityOption(parsed, 'fail-on', config.failOn);
      const result = await scan({ cwd: process.cwd(), inputs: parsed.args, config: { ...config, format, failOn } });
      const rendered = formatScanResult(result, format);
      const output = stringOption(parsed, 'output');
      if (output) {
        await writeFile(output, rendered, 'utf8');
      } else {
        process.stdout.write(rendered);
      }
      return hasFailingFindings(result, failOn) ? 2 : 0;
    }

    process.stdout.write(usage());
    return 0;
  } catch (error) {
    process.stderr.write(`promptprobe: ${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

function parse(argv: string[]): Parsed {
  const [command = 'help', ...rest] = argv;
  const args: string[] = [];
  const options = new Map<string, string | boolean>();

  for (let index = 0; index < rest.length; index += 1) {
    const item = rest[index]!;
    if (!item.startsWith('--')) {
      args.push(item);
      continue;
    }
    const [name, inline] = item.slice(2).split('=', 2);
    if (!name) throw new Error(`invalid option: ${item}`);
    if (inline !== undefined) {
      options.set(name, inline);
    } else if (rest[index + 1] && !rest[index + 1]!.startsWith('--')) {
      options.set(name, rest[index + 1]!);
      index += 1;
    } else {
      options.set(name, true);
    }
  }

  return { command: command === '--help' || command === '-h' ? 'help' : command, args, options };
}

function stringOption(parsed: Parsed, name: string): string | undefined {
  const value = parsed.options.get(name);
  return typeof value === 'string' ? value : undefined;
}

function formatOption(parsed: Parsed, name: string, fallback: OutputFormat): OutputFormat {
  const value = stringOption(parsed, name) ?? fallback;
  if (value === 'text' || value === 'json' || value === 'markdown') return value;
  throw new Error(`--${name} must be text, json, or markdown`);
}

function severityOption(parsed: Parsed, name: string, fallback: Severity): Severity {
  const value = stringOption(parsed, name) ?? fallback;
  if (value === 'low' || value === 'medium' || value === 'high') return value;
  throw new Error(`--${name} must be low, medium, or high`);
}

function usage(): string {
  return `Usage:
  promptprobe init
  promptprobe scan [files...] [--format text|json|markdown] [--output path] [--fail-on low|medium|high]
  promptprobe rules [--format text|json|markdown]
  promptprobe explain PP003

Default config:
${JSON.stringify(defaultConfig, null, 2)}
`;
}

process.exitCode = await main(process.argv.slice(2));
