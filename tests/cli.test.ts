import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, it } from 'node:test';

const execFileAsync = promisify(execFile);
const cli = path.resolve('dist/src/cli.js');

describe('cli scan inputs', () => {
  it('prints a diagnostic and exits nonzero for an unmatched explicit input', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'promptprobe-cli-'));

    await assert.rejects(
      execFileAsync(process.execPath, [cli, 'scan', 'typo-does-not-exist.md', '--format', 'json'], { cwd: root }),
      (error: Error & { code?: number; stderr?: string }) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr ?? '', /promptprobe: input did not match any files: typo-does-not-exist\.md/);
        return true;
      }
    );
  });

  it('keeps a default zero-file scan successful', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'promptprobe-cli-'));

    const { stdout, stderr } = await execFileAsync(process.execPath, [cli, 'scan', '--format', 'json'], { cwd: root });

    assert.equal(stderr, '');
    const result = JSON.parse(stdout) as { files: string[]; summary: { filesScanned: number } };
    assert.deepEqual(result.files, []);
    assert.equal(result.summary.filesScanned, 0);
  });
});
