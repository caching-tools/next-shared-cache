import { promises as fsPromises } from 'node:fs';
import path from 'node:path';
import { PRERENDER_MANIFEST, SERVER_DIRECTORY } from 'next/constants.js';
import { PRERENDER_MANIFEST_VERSION } from '../constants.js';
import { CachedRouteKind } from '../next-common-types.js';
import type { CacheHandlerType } from '../cache-handler.js';
import type { Revalidate } from '../next-common-types.js';
import type { PrerenderManifest } from 'next/dist/build/index.js';

type Router = 'pages' | 'app';

/**
 * Options for the `registerInitialCache` instrumentation.
 *
 * @since 1.7.0
 */
export type RegisterInitialCacheOptions = {
  /**
   * Whether to populate the cache with pre-rendered pages.
   *
   * @default true
   *
   * @since 1.7.0
   */
  pages?: boolean;
};

/**
 * Populates the cache with the initial data.
 *
 * By default, it includes the following:
 * - Pre-rendered pages
 * - Routes
 * - Fetch calls
 *
 * @param CacheHandler - The configured CacheHandler class, not an instance.
 *
 * @param [options] - Options for the instrumentation. See {@link RegisterInitialCacheOptions}.
 *
 * @param [options.fetch] - Whether to populate the cache with fetch calls.
 *
 * @param [options.pages] - Whether to populate the cache with pre-rendered pages.
 *
 * @param [options.routes] - Whether to populate the cache with routes.
 *
 * @example file: `instrumentation.ts`
 *
 * ```js
 * export async function register() {
 *  if (process.env.NEXT_RUNTIME === 'nodejs') {
 *    const { registerInitialCache } = await import('@neshca/cache-handler/instrumentation');
 *    // Assuming that your CacheHandler configuration is in the root of the project and the instrumentation is in the src directory.
 *    // Please adjust the path accordingly.
 *    // CommonJS CacheHandler configuration is also supported.
 *    const CacheHandler = (await import('../cache-handler.mjs')).default;
 *    await registerInitialCache(CacheHandler);
 *  }
 * }
 * ```
 *
 * @since 1.7.0
 */
export async function registerInitialCache(
  CacheHandler: CacheHandlerType,
  options: RegisterInitialCacheOptions = {},
): Promise<void> {
  const debug = typeof process.env.NEXT_PRIVATE_DEBUG_CACHE !== 'undefined';
  const nextJsPath = path.join(process.cwd(), '.next');
  const prerenderManifestPath = path.join(nextJsPath, PRERENDER_MANIFEST);
  const serverDistDir = path.join(nextJsPath, SERVER_DIRECTORY);

  const populatePages = options.pages ?? true;

  let prerenderManifest: PrerenderManifest | undefined;

  try {
    const prerenderManifestData = await fsPromises.readFile(
      prerenderManifestPath,
      'utf-8',
    );
    prerenderManifest = JSON.parse(prerenderManifestData) as PrerenderManifest;

    if (prerenderManifest.version !== PRERENDER_MANIFEST_VERSION) {
      throw new Error(
        `Invalid prerender manifest version. Expected version ${PRERENDER_MANIFEST_VERSION}. Please check if the Next.js version is compatible with the CacheHandler version.`,
      );
    }
  } catch (error) {
    if (debug) {
      console.warn(
        '[CacheHandler] [%s] %s %s',
        'registerInitialCache',
        'Failed to read prerender manifest',
        `Error: ${error as Error}`,
      );
    }

    return;
  }

  const context = {
    serverDistDir,
    dev: process.env.NODE_ENV === 'development',
  };

  let cacheHandler: InstanceType<CacheHandlerType>;

  try {
    cacheHandler = new CacheHandler(
      context as ConstructorParameters<typeof CacheHandler>[0],
    );
  } catch (error) {
    if (debug) {
      console.warn(
        '[CacheHandler] [%s] %s %s',
        'registerInitialCache',
        'Failed to create CacheHandler instance',
        `Error: ${error as Error}`,
      );
    }

    return;
  }

  /**
   * Sets the page cache.
   *
   * @param cachePath - The path to the page cache.
   *
   * @param router - The router to set the page cache for.
   *
   * @param revalidate - The revalidate time for the page cache.
   */
  async function setPageCache(
    cachePath: string,
    router: Router,
    revalidate: Revalidate,
  ): Promise<void> {
    const pathToRouteFiles = path.join(serverDistDir, router, cachePath);

    let lastModified: number | undefined;

    try {
      const stats = await fsPromises.stat(`${pathToRouteFiles}.html`);
      lastModified = stats.mtimeMs;
    } catch (error) {
      if (debug) {
        console.warn(
          '[CacheHandler] [%s] %s %s',
          'registerInitialCache',
          'Failed to read page html file',
          `Error: ${error as Error}`,
        );
      }
      return;
    }

    let html: string | undefined;
    let pageData: string | object | undefined;

    try {
      [html, pageData] = await Promise.all([
        fsPromises.readFile(`${pathToRouteFiles}.html`, 'utf-8'),
        fsPromises
          .readFile(`${pathToRouteFiles}.json`, 'utf-8')
          .then((data) => JSON.parse(data) as object),
      ]);
    } catch (error) {
      if (debug) {
        console.warn(
          '[CacheHandler] [%s] %s %s',
          'registerInitialCache',
          'Failed to read page html, page data, or metadata file, or parse metadata',
          `Error: ${error as Error}`,
        );
      }

      return;
    }

    try {
      await cacheHandler.set(
        cachePath,
        {
          kind: CachedRouteKind.PAGES,
          html,
          pageData,
          headers: undefined,
          status: undefined,
        },
        {
          neshca_lastModified: lastModified,
          fetchCache: false,
          cacheControl: { revalidate, expire: 0 },
        },
      );
    } catch (error) {
      if (debug) {
        console.warn(
          '[CacheHandler] [%s] %s %s',
          'registerInitialCache',
          'Failed to set page cache. Please check if the CacheHandler is configured correctly',
          `Error: ${error as Error}`,
        );
      }

      return;
    }
  }

  for (const [
    cachePath,
    { dataRoute, initialRevalidateSeconds },
  ] of Object.entries(prerenderManifest.routes)) {
    if (populatePages && dataRoute?.endsWith('.json')) {
      await setPageCache(cachePath, 'pages', initialRevalidateSeconds);
    }
  }
}
