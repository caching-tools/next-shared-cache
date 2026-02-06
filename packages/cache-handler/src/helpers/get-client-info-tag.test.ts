import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getClientInfoTag } from './get-client-info-tag';

await test('returns a string starting with neshca-cache-handler', () => {
  const tag = getClientInfoTag();
  assert.ok(
    tag.startsWith('neshca-cache-handler'),
    `Expected tag to start with "neshca-cache-handler", got "${tag}"`,
  );
});

await test('returns tag with version when package.json is readable', () => {
  const tag = getClientInfoTag();
  // The tag should match the pattern neshca-cache-handler_vX.Y.Z
  const versionPattern = /^neshca-cache-handler_v\d+\.\d+\.\d+$/;
  assert.ok(
    versionPattern.test(tag),
    `Expected tag to match version pattern, got "${tag}"`,
  );
});

await test('returns consistent results on multiple calls', () => {
  const tag1 = getClientInfoTag();
  const tag2 = getClientInfoTag();
  assert.strictEqual(
    tag1,
    tag2,
    'Expected getClientInfoTag to return consistent results',
  );
});

await test('returns tag containing the actual package version', async () => {
  const tag = getClientInfoTag();
  // Read the actual version from package.json to verify
  const { readFileSync } = await import('node:fs');
  const { dirname, join } = await import('node:path');
  const { fileURLToPath } = await import('node:url');

  const currentDir = dirname(fileURLToPath(import.meta.url));
  const packageJsonPath = join(currentDir, '..', '..', 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
    version: string;
  };

  assert.strictEqual(
    tag,
    `neshca-cache-handler_v${packageJson.version}`,
    `Expected tag to contain version ${packageJson.version}`,
  );
});
