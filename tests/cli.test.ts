import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
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

describe('cli option validation', () => {
  it('rejects unknown options before running each command', async () => {
    for (const command of ['scan', 'rules', 'explain', 'init']) {
      const root = await mkdtemp(path.join(tmpdir(), 'promptprobe-cli-'));
      const args = command === 'explain' ? [command, 'PP003', '--bogus'] : [command, '--bogus'];

      await assert.rejects(
        execFileAsync(process.execPath, [cli, ...args], { cwd: root }),
        (error: Error & { code?: number; stderr?: string }) => {
          assert.equal(error.code, 1);
          assert.match(error.stderr ?? '', new RegExp(`promptprobe: unknown option for ${command}: --bogus`));
          return true;
        }
      );
    }
  });

  it('rejects missing and empty option values without writing scan output', async () => {
    for (const option of ['output', 'format', 'fail-on']) {
      for (const argument of [`--${option}`, `--${option}=`]) {
        const root = await mkdtemp(path.join(tmpdir(), 'promptprobe-cli-'));

        await assert.rejects(
          execFileAsync(process.execPath, [cli, 'scan', argument], { cwd: root }),
          (error: Error & { code?: number; stdout?: string; stderr?: string }) => {
            assert.equal(error.code, 1);
            assert.equal(error.stdout, '');
            assert.match(error.stderr ?? '', new RegExp(`promptprobe: --${option} requires a value`));
            return true;
          }
        );
      }
    }
  });

  it('rejects invalid enumerated values', async () => {
    for (const args of [
      ['scan', '--format', 'yaml'],
      ['scan', '--fail-on', 'critical'],
      ['rules', '--format=csv']
    ]) {
      await assert.rejects(
        execFileAsync(process.execPath, [cli, ...args]),
        (error: Error & { code?: number; stderr?: string }) => {
          assert.equal(error.code, 1);
          assert.match(error.stderr ?? '', /^promptprobe: --(?:format|fail-on) must be /);
          return true;
        }
      );
    }
  });

  it('accepts documented inline and separate option forms', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'promptprobe-cli-'));
    const input = path.join(root, 'safe.md');
    const output = path.join(root, 'report.json');
    await writeFile(
      input,
      [
        '# Safe instructions',
        '',
        'Follow the authority order from system, organization, repository, task, then local notes.',
        '',
        'Keep secrets, credentials, private data, and customer information private unless the user gives explicit approval.',
        '',
        'Ask before publishing, pushing, deploying, sending messages, or taking destructive remote actions.',
        ''
      ].join('\n'),
      'utf8'
    );

    const scan = await execFileAsync(
      process.execPath,
      [cli, 'scan', input, '--format=json', '--fail-on', 'high', '--output', output],
      { cwd: root }
    );
    assert.equal(scan.stdout, '');
    assert.deepEqual(JSON.parse(await readFile(output, 'utf8')).summary, {
      filesScanned: 1,
      findings: 0,
      high: 0,
      medium: 0,
      low: 0
    });

    const rules = await execFileAsync(process.execPath, [cli, 'rules', '--format', 'json']);
    assert.ok(Array.isArray(JSON.parse(rules.stdout)));
    assert.match((await execFileAsync(process.execPath, [cli, 'explain', 'PP003'])).stdout, /^PP003 /);

    const initRoot = await mkdtemp(path.join(tmpdir(), 'promptprobe-cli-'));
    assert.match((await execFileAsync(process.execPath, [cli, 'init'], { cwd: initRoot })).stdout, /^Created /);
  });
});
