import { constants as fsConstants } from 'node:fs';
import { access, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type { ProbeDocument } from './types.js';

export async function resolveInputFiles(cwd: string, patterns: string[], exclude: string[]): Promise<string[]> {
  const candidates = new Set<string>();
  const allFiles = await listFiles(cwd);
  const excludeRegexes = exclude.map(globToRegExp);

  for (const input of patterns) {
    const normalized = normalizePath(input);
    const absolute = path.resolve(cwd, input);

    if (await isFile(absolute)) {
      candidates.add(normalizePath(path.relative(cwd, absolute)));
      continue;
    }

    const regex = globToRegExp(normalized);
    for (const file of allFiles) {
      if (regex.test(file)) {
        candidates.add(file);
      }
    }
  }

  return [...candidates]
    .filter((file) => !excludeRegexes.some((regex) => regex.test(file)))
    .sort((left, right) => left.localeCompare(right));
}

export async function readDocument(cwd: string, relativePath: string): Promise<ProbeDocument> {
  const content = await readFile(path.join(cwd, relativePath), 'utf8');
  return {
    path: relativePath,
    content,
    lines: content.split(/\r?\n/)
  };
}

function globToRegExp(glob: string): RegExp {
  const normalized = normalizePath(glob);
  let source = '^';

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    const next = normalized[index + 1];

    if (char === '*' && next === '*') {
      if (normalized[index + 2] === '/') {
        source += '(?:.*\\/)?';
        index += 2;
      } else {
        source += '.*';
        index += 1;
      }
      continue;
    }

    if (char === '*') {
      source += '[^/]*';
      continue;
    }

    if (char === '?') {
      source += '[^/]';
      continue;
    }

    source += escapeRegExp(char ?? '');
  }

  source += '$';
  return new RegExp(source);
}

async function listFiles(root: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      const relative = normalizePath(path.relative(root, absolute));

      if (entry.isDirectory()) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue;
        }
        await walk(absolute);
        continue;
      }

      if (entry.isFile()) {
        files.push(relative);
      }
    }
  }

  await walk(root);
  return files;
}

async function isFile(filePath: string): Promise<boolean> {
  try {
    await access(filePath, fsConstants.F_OK);
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function escapeRegExp(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}
