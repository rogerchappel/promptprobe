import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const execFileAsync = promisify(execFile);
const testDir = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.resolve(testDir, '../src/cli.js');
const packagePath = path.resolve(testDir, '../../package.json');

describe('cli', () => {
  it('prints the package version', async () => {
    const pkg = JSON.parse(await readFile(packagePath, 'utf8')) as { version: string };

    const { stdout, stderr } = await execFileAsync(process.execPath, [cliPath, '--version']);

    assert.equal(stderr, '');
    assert.equal(stdout, `${pkg.version}\n`);
  });

  it('prints usage for help', async () => {
    const { stdout, stderr } = await execFileAsync(process.execPath, [cliPath, '--help']);

    assert.equal(stderr, '');
    assert.match(stdout, /promptprobe scan/);
    assert.match(stdout, /promptprobe version/);
  });
});
