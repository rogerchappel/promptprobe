import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { defaultConfig, loadConfig } from '../src/config.js';

async function configRoot(config: unknown): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'promptprobe-config-'));
  await writeFile(path.join(root, '.promptprobe.json'), JSON.stringify(config), 'utf8');
  return root;
}

describe('loadConfig', () => {
  it('merges valid partial configuration with defaults', async () => {
    const root = await configRoot({ failOn: 'medium', ignoredRules: ['pp001'] });

    assert.deepEqual(await loadConfig(root), {
      ...defaultConfig,
      ignoredRules: ['PP001'],
      failOn: 'medium'
    });
  });

  it('preserves an explicit empty files array', async () => {
    const root = await configRoot({ files: [] });

    assert.deepEqual((await loadConfig(root)).files, []);
  });

  it('rejects unknown keys', async () => {
    const root = await configRoot({ typo: true });

    await assert.rejects(loadConfig(root), /unknown configuration key: typo/);
  });

  it('rejects unsupported enum values', async () => {
    await assert.rejects(loadConfig(await configRoot({ failOn: 'critical' })), /failOn must be low, medium, or high/);
    await assert.rejects(loadConfig(await configRoot({ format: 'yaml' })), /format must be text, json, or markdown/);
  });

  it('rejects non-array collection fields', async () => {
    await assert.rejects(loadConfig(await configRoot({ files: 'README.md' })), /files must be an array of non-empty strings/);
    await assert.rejects(loadConfig(await configRoot({ exclude: null })), /exclude must be an array of non-empty strings/);
    await assert.rejects(loadConfig(await configRoot({ ignoredRules: {} })), /ignoredRules must be an array of non-empty strings/);
  });

  it('rejects non-string and empty collection entries', async () => {
    await assert.rejects(loadConfig(await configRoot({ files: ['README.md', 7] })), /files\[1\] must be a non-empty string/);
    await assert.rejects(loadConfig(await configRoot({ exclude: [''] })), /exclude\[0\] must be a non-empty string/);
    await assert.rejects(loadConfig(await configRoot({ ignoredRules: ['  '] })), /ignoredRules\[0\] must be a non-empty string/);
  });
});
