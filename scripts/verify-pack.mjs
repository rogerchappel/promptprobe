import { spawnSync } from 'node:child_process';

const requiredFiles = [
  'dist/src/cli.js',
  'dist/src/index.js',
  'examples/risky-agent-instructions.md',
  'examples/safer-agent-instructions.md',
  'README.md',
  'LICENSE',
  'SECURITY.md',
  'CHANGELOG.md'
];

const pack = spawnSync('npm', ['pack', '--dry-run', '--json'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe']
});

if (pack.status !== 0) {
  process.stderr.write(pack.stderr);
  process.exit(pack.status ?? 1);
}

const [{ files = [] } = {}] = JSON.parse(pack.stdout);
const packedPaths = new Set(files.map((file) => file.path));
const missing = requiredFiles.filter((file) => !packedPaths.has(file));
const shippedTests = [...packedPaths].filter((file) => file.startsWith('dist/tests/') || /(^|\/).+\.test\.(js|d\.ts|js\.map)$/.test(file));

if (missing.length > 0 || shippedTests.length > 0) {
  if (missing.length > 0) {
    console.error(`Missing required package files: ${missing.join(', ')}`);
  }
  if (shippedTests.length > 0) {
    console.error(`Packaged compiled test artifacts: ${shippedTests.join(', ')}`);
  }
  process.exit(1);
}

console.log(`Package manifest verified with ${packedPaths.size} files.`);
