import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [workflow, pkg] = await Promise.all([
  readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8'),
  readFile(new URL('../package.json', import.meta.url), 'utf8').then(JSON.parse),
]);

const minimum = String(pkg.engines?.node).match(/\d+/)?.[0];
assert.equal(minimum, '20', 'package engines.node must retain the Node 20 floor');
assert.match(workflow, /node-version:\s*\[20, 22, 24\]/, 'CI must test Node 20, 22, and 24');
assert.match(workflow, /actions\/setup-node@v6/, 'CI must explicitly set up Node');
assert.match(workflow, /npm ci[\s\S]*npm run release:check/, 'each matrix job must run a frozen install and release checks');
assert.match(workflow, /permissions:\s*\n\s*contents:\s*read/, 'CI permissions must remain read-only');

console.log('CI runtime contract passed');
