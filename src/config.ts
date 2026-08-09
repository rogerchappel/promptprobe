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

  const parsed: unknown = JSON.parse(await readFile(configPath, 'utf8'));
  validateConfig(parsed);
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

  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function validateConfig(value: unknown): asserts value is Partial<PromptProbeConfig> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('configuration must be a JSON object');
  }

  const config = value as Record<string, unknown>;
  const allowedKeys = new Set(['files', 'exclude', 'ignoredRules', 'failOn', 'format']);
  for (const key of Object.keys(config)) {
    if (!allowedKeys.has(key)) throw new Error(`unknown configuration key: ${key}`);
  }

  for (const field of ['files', 'exclude', 'ignoredRules'] as const) {
    const fieldValue = config[field];
    if (fieldValue === undefined) continue;
    if (!Array.isArray(fieldValue)) throw new Error(`${field} must be an array of non-empty strings`);
    fieldValue.forEach((item, index) => {
      if (typeof item !== 'string' || item.trim().length === 0) {
        throw new Error(`${field}[${index}] must be a non-empty string`);
      }
    });
  }

  if (config.failOn !== undefined && config.failOn !== 'low' && config.failOn !== 'medium' && config.failOn !== 'high') {
    throw new Error('failOn must be low, medium, or high');
  }
  if (config.format !== undefined && config.format !== 'text' && config.format !== 'json' && config.format !== 'markdown') {
    throw new Error('format must be text, json, or markdown');
  }
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
