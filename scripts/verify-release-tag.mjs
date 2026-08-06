import { readFile } from 'node:fs/promises';

const tag = process.argv[2] ?? process.env.GITHUB_REF_NAME;
const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const expected = `v${version}`;

if (!tag) {
  console.error('release tag is required as an argument or GITHUB_REF_NAME');
  process.exit(1);
}
if (tag !== expected) {
  console.error(`release tag ${tag} does not match package version ${expected}`);
  process.exit(1);
}
console.log(`release tag matches package version: ${tag}`);
