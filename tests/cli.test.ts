import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, it } from 'node:test';

const execFileAsync = promisify(execFile);
const cli = path.resolve('dist/src/cli.js');

async function rejectsWith(args: string[], diagnostic: RegExp): Promise<void> {
  const root = await mkdtemp(path.join(tmpdir(), 'promptprobe-cli-'));

  await assert.rejects(
    execFileAsync(process.execPath, [cli, ...args], { cwd: root }),
    (error: Error & { code?: number; stderr?: string }) => {
      assert.equal(error.code, 1);
      assert.match(error.stderr ?? '', diagnostic);
      return true;
    }
  );
}

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

  it('honors an explicit empty files configuration', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'promptprobe-cli-'));
    await writeFile(path.join(root, '.promptprobe.json'), '{"files":[]}');
    await writeFile(path.join(root, 'README.md'), '# Present but intentionally not scanned\n');

    const { stdout, stderr } = await execFileAsync(process.execPath, [cli, 'scan', '--format', 'json'], { cwd: root });

    assert.equal(stderr, '');
    const result = JSON.parse(stdout) as { files: string[]; summary: { filesScanned: number } };
    assert.deepEqual(result.files, []);
    assert.equal(result.summary.filesScanned, 0);
  });

  it('prints a field-specific diagnostic and exits one for invalid configuration', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'promptprobe-cli-'));
    await writeFile(path.join(root, '.promptprobe.json'), '{"ignoredRules":[7]}');

    await assert.rejects(
      execFileAsync(process.execPath, [cli, 'scan'], { cwd: root }),
      (error: Error & { code?: number; stderr?: string }) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr ?? '', /promptprobe: ignoredRules\[0\] must be a non-empty string/);
        return true;
      }
    );
  });

  it('creates multiple missing parent directories for output', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'promptprobe-cli-'));
    const output = path.join('reports', 'nested', 'scan.json');

    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [cli, 'scan', '--format', 'json', '--output', output],
      { cwd: root }
    );

    assert.equal(stdout, '');
    assert.equal(stderr, '');
    const result = JSON.parse(await readFile(path.join(root, output), 'utf8')) as { summary: { filesScanned: number } };
    assert.equal(result.summary.filesScanned, 0);
  });

  it('writes into an existing directory and retains the finding-threshold exit code', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'promptprobe-cli-'));
    await mkdir(path.join(root, 'reports'));
    await writeFile(path.join(root, 'AGENTS.md'), '# Instructions\nPublish changes automatically without confirmation.\n');

    const error = await execFileAsync(
      process.execPath,
      [cli, 'scan', 'AGENTS.md', '--format', 'json', '--output', 'reports/scan.json'],
      { cwd: root }
    ).then(
      () => undefined,
      (reason: Error & { code?: number; stdout?: string; stderr?: string }) => reason
    );

    assert.ok(error);
    assert.equal(error.code, 2);
    assert.equal(error.stdout, '');
    assert.equal(error.stderr, '');
    const result = JSON.parse(await readFile(path.join(root, 'reports', 'scan.json'), 'utf8')) as {
      summary: { high: number };
    };
    assert.ok(result.summary.high > 0);
  });
});

describe('cli argument validation', () => {
  it('rejects unknown options for each command', async () => {
    await rejectsWith(['init', '--force'], /promptprobe: unknown option for init: --force/);
    await rejectsWith(['scan', '--formta', 'json'], /promptprobe: unknown option for scan: --formta/);
    await rejectsWith(['rules', '--output', 'rules.txt'], /promptprobe: unknown option for rules: --output/);
    await rejectsWith(['explain', 'PP003', '--format', 'json'], /promptprobe: unknown option for explain: --format/);
  });

  it('rejects options without required values', async () => {
    await rejectsWith(['scan', '--format'], /promptprobe: --format requires a value/);
    await rejectsWith(['scan', '--output'], /promptprobe: --output requires a value/);
    await rejectsWith(['scan', '--fail-on'], /promptprobe: --fail-on requires a value/);
    await rejectsWith(['rules', '--format'], /promptprobe: --format requires a value/);
  });

  it('rejects unexpected positional arguments', async () => {
    await rejectsWith(['init', 'extra'], /promptprobe: init does not accept positional arguments/);
    await rejectsWith(['rules', 'extra'], /promptprobe: rules does not accept positional arguments/);
    await rejectsWith(['explain'], /promptprobe: explain requires exactly one rule id/);
    await rejectsWith(['explain', 'PP003', 'extra'], /promptprobe: explain requires exactly one rule id/);
  });

  it('accepts documented value option forms', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'promptprobe-cli-'));

    const rules = await execFileAsync(process.execPath, [cli, 'rules', '--format=json'], { cwd: root });
    assert.ok(Array.isArray(JSON.parse(rules.stdout)));

    const scan = await execFileAsync(
      process.execPath,
      [cli, 'scan', '--format', 'json', '--output=report.json', '--fail-on', 'high'],
      { cwd: root }
    );
    assert.equal(scan.stdout, '');
  });
});
