import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function getPackageVersion(): string | undefined {
  try {
    // ESM context
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const packageJsonPath = join(currentDir, '..', '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
      version: string;
    };
    return packageJson.version;
  } catch {
    return undefined;
  }
}

/**
 * Returns a client info tag string for Redis client identification.
 *
 * This function reads the version from `@neshca/cache-handler/package.json`
 * and returns a formatted string like `neshca-cache-handler_v1.9.0`.
 *
 * If the version cannot be read, it falls back to `neshca-cache-handler`.
 *
 * @example
 * ```js
 * import { createClient } from 'redis';
 * import { getClientInfoTag } from '@neshca/cache-handler/helpers';
 *
 * const client = createClient({
 *   url: 'redis://localhost:6379',
 *   clientInfoTag: getClientInfoTag(),
 * });
 * ```
 *
 * @returns The client info tag string for Redis identification.
 */
export function getClientInfoTag(): string {
  const version = getPackageVersion();
  if (version) {
    return `neshca-cache-handler_v${version}`;
  }
  return 'neshca-cache-handler';
}
