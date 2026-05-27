import { constants as fsConstants } from 'node:fs';
import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { OutputFormat, PromptProbeConfig, Severity } from './types.js';

export const configFileName = '.promptprobe.json';

export const defaultConfig: PromptProbeConfig = {
  files: [
    'AGENTS.md',
    'CLAUDE.md',
    'README.md',
    'docs/**/*.md',
    'skills/**/*.md',
    '**/*.prompt.md',
    '**/*.instructions.md'
  ],
  exclude: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**', '.git/**'],
  ignoredRules: [],
  failOn: 'high',
  format: 'text'
};

export async function loadConfig(cwd: string): Promise<PromptProbeConfig> {
  const configPath = path.join(cwd, configFileName);
  if (!(await exists(configPath))) {
    return { ...defaultConfig };
  }

  const parsed = JSON.parse(await readFile(configPath, 'utf8')) as Partial<PromptProbeConfig>;
  return normalizeConfig(parsed);
}

export function normalizeConfig(input: Partial<PromptProbeConfig>): PromptProbeConfig {
  return {
    files: stringArray(input.files, defaultConfig.files),
    exclude: stringArray(input.exclude, defaultConfig.exclude),
    ignoredRules: stringArray(input.ignoredRules, defaultConfig.ignoredRules).map((rule) => rule.toUpperCase()),
    failOn: severity(input.failOn, defaultConfig.failOn),
    format: outputFormat(input.format, defaultConfig.format)
  };
}

export async function writeDefaultConfig(cwd: string): Promise<string> {
  const destination = path.join(cwd, configFileName);
  await writeFile(destination, `${JSON.stringify(defaultConfig, null, 2)}\n`, { flag: 'wx' });
  return destination;
}

function stringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const filtered = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  return filtered.length > 0 || fallback.length === 0 ? filtered : [...fallback];
}

function severity(value: unknown, fallback: Severity): Severity {
  return value === 'low' || value === 'medium' || value === 'high' ? value : fallback;
}

function outputFormat(value: unknown, fallback: OutputFormat): OutputFormat {
  return value === 'text' || value === 'json' || value === 'markdown' ? value : fallback;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}
