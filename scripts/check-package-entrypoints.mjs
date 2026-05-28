#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const requiredPaths = new Set();

if (typeof pkg.main === 'string') {
  requiredPaths.add(pkg.main);
}

for (const value of Object.values(pkg.bin ?? {})) {
  if (typeof value === 'string') {
    requiredPaths.add(value);
  }
}

for (const exportValue of Object.values(pkg.exports ?? {})) {
  collectExportPaths(exportValue);
}

const missing = [];
for (const relativePath of requiredPaths) {
  try {
    await access(path.join(root, relativePath));
  } catch {
    missing.push(relativePath);
  }
}

if (missing.length > 0) {
  console.error(`Missing package entrypoint(s): ${missing.join(', ')}`);
  console.error('Run npm run build and verify package.json main/bin/exports match the emitted dist layout.');
  process.exit(1);
}

console.log(`Checked ${requiredPaths.size} package entrypoint(s).`);

function collectExportPaths(value) {
  if (typeof value === 'string') {
    requiredPaths.add(value);
    return;
  }

  if (!value || typeof value !== 'object') {
    return;
  }

  for (const child of Object.values(value)) {
    collectExportPaths(child);
  }
}
