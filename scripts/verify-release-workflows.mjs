import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const release = await readFile(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8');
const dryRun = await readFile(new URL('../.github/workflows/release-dry-run.yml', import.meta.url), 'utf8');

for (const [name, workflow] of [['release', release], ['release dry run', dryRun]]) {
  assert.match(workflow, /npm run release:tag -- /, `${name} must validate the release tag`);
}
assert.match(dryRun, /npm publish --dry-run --provenance --access public/);
assert.match(release, /npm publish --provenance --access public/);
assert.ok(
  release.indexOf('npm publish --provenance --access public') < release.indexOf('gh release create'),
  'npm publication must happen before GitHub release creation',
);
console.log('release workflow invariants passed');
