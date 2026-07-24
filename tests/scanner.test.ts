import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { scan } from '../src/scanner.js';

describe('scan', () => {
  it('detects privacy gaps and conflicting external-action rules', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'promptprobe-'));
    await writeFile(path.join(root, 'AGENTS.md'), 'Push directly without asking.\nNever push without confirmation.\n');

    const result = await scan({ cwd: root, inputs: ['AGENTS.md'] });

    assert.equal(result.summary.filesScanned, 1);
    assert.ok(result.findings.some((finding) => finding.ruleId === 'PP003'));
    assert.ok(result.findings.some((finding) => finding.ruleId === 'PP005'));
  });

  it('resolves markdown globs deterministically', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'promptprobe-'));
    await mkdir(path.join(root, 'docs'));
    await writeFile(path.join(root, 'docs', 'one.md'), 'Private data stays private. Do not share secrets.\n');
    await writeFile(path.join(root, 'docs', 'two.md'), 'Private data stays private. Do not share secrets.\n');

    const result = await scan({ cwd: root, inputs: ['docs/**/*.md'], config: { ignoredRules: ['PP005'] } });

    assert.deepEqual(result.files, ['docs/one.md', 'docs/two.md']);
    assert.equal(result.summary.findings, 0);
  });

  it('rejects a missing explicit file', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'promptprobe-'));

    await assert.rejects(
      scan({ cwd: root, inputs: ['typo.md'] }),
      /input did not match any files: typo\.md/
    );
  });

  it('rejects an unmatched explicit glob', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'promptprobe-'));

    await assert.rejects(
      scan({ cwd: root, inputs: ['docs/**/*.md'] }),
      /input did not match any files: docs\/\*\*\/\*\.md/
    );
  });

  it('reports unmatched inputs even when another explicit input matches', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'promptprobe-'));
    await writeFile(path.join(root, 'AGENTS.md'), 'Private data stays private.\n');

    await assert.rejects(
      scan({ cwd: root, inputs: ['AGENTS.md', 'missing.md', 'notes/*.md'] }),
      /inputs did not match any files: missing\.md, notes\/\*\.md/
    );
  });

  it('allows configured globs to match no files', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'promptprobe-'));

    const result = await scan({ cwd: root, inputs: [], config: { files: ['docs/**/*.md'] } });

    assert.deepEqual(result.files, []);
    assert.equal(result.summary.filesScanned, 0);
  });

  it('allows built-in defaults to match no files', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'promptprobe-'));

    const result = await scan({ cwd: root, inputs: [] });

    assert.deepEqual(result.files, []);
    assert.equal(result.summary.filesScanned, 0);
  });
});
