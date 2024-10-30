import { promises as fsPromises } from 'node:fs';
import path from 'node:path';
import type { CachedFetchValue, Revalidate, RouteMetadata } from '@repo/next-common';
import { PRERENDER_MANIFEST, SERVER_DIRECTORY } from 'next/constants';
import type { PrerenderManifest } from 'next/dist/build';
import { CACHE_ONE_YEAR } from 'next/dist/lib/constants';
import { getTagsFromHeaders } from '../helpers/get-tags-from-headers';

type CacheHandlerType = typeof import('../cache-handler').CacheHandler;

type Router = 'pages' | 'app';

const PRERENDER_MANIFEST_VERSION = 4;

/**
 * Options for the `registerInitialCache` instrumentation.
 *
 * @since 1.7.0
 */
export type RegisterInitialCacheOptions = {
    /**
     * Whether to populate the cache with fetch calls.
     *
     * @default true
     *
     * @since 1.7.0
     */
    fetch?: boolean;
    /**
     * Whether to populate the cache with pre-rendered pages.
     *
     * @default true
     *
     * @since 1.7.0
     */
    pages?: boolean;
    /**
     * Whether to populate the cache with routes.
     *
     * @default true
     *
     * @since 1.7.0
     */
    routes?: boolean;
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
 * @param [options={}] - Options for the instrumentation. See {@link RegisterInitialCacheOptions}.
 *
 * @param [options.fetch=true] - Whether to populate the cache with fetch calls.
 *
 * @param [options.pages=true] - Whether to populate the cache with pre-rendered pages.
 *
 * @param [options.routes=true] - Whether to populate the cache with routes.
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
export async function registerInitialCache(CacheHandler: CacheHandlerType, options: RegisterInitialCacheOptions = {}) {
    const debug = typeof process.env.NEXT_PRIVATE_DEBUG_CACHE !== 'undefined';
    const nextJsPath = path.join(process.cwd(), '.next');
    const prerenderManifestPath = path.join(nextJsPath, PRERENDER_MANIFEST);
    const serverDistDir = path.join(nextJsPath, SERVER_DIRECTORY);
    const fetchCacheDir = path.join(nextJsPath, 'cache', 'fetch-cache');

    const populateFetch = options.fetch ?? true;
    const populatePages = options.pages ?? true;
    const populateRoutes = options.routes ?? true;

    let prerenderManifest: PrerenderManifest | undefined;

    try {
        const prerenderManifestData = await fsPromises.readFile(prerenderManifestPath, 'utf-8');
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
                `Error: ${error}`,
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
        cacheHandler = new CacheHandler(context as ConstructorParameters<typeof CacheHandler>[0]);
    } catch (error) {
        if (debug) {
            console.warn(
                '[CacheHandler] [%s] %s %s',
                'registerInitialCache',
                'Failed to create CacheHandler instance',
                `Error: ${error}`,
            );
        }

        return;
    }

    async function setRouteCache(cachePath: string, router: Router, revalidate: Revalidate) {
        const pathToRouteFiles = path.join(serverDistDir, router, cachePath);

        let lastModified: number | undefined;

        try {
            const stats = await fsPromises.stat(`${pathToRouteFiles}.body`);
            lastModified = stats.mtimeMs;
        } catch (error) {
            if (debug) {
                console.warn(
                    '[CacheHandler] [%s] %s %s',
                    'registerInitialCache',
                    'Failed to read route body file',
                    `Error: ${error}`,
                );
            }

            return;
        }

        let body: Buffer;
        let meta: RouteMetadata;

        try {
            [body, meta] = await Promise.all([
                fsPromises.readFile(`${pathToRouteFiles}.body`),
                fsPromises
                    .readFile(`${pathToRouteFiles}.meta`, 'utf-8')
                    .then((data) => JSON.parse(data) as RouteMetadata),
            ]);

            if (!(meta.headers && meta.status)) {
                throw new Error('Invalid route metadata. Missing headers or status.');
            }
        } catch (error) {
            if (debug) {
                console.warn(
                    '[CacheHandler] [%s] %s %s',
                    'registerInitialCache',
                    'Failed to read route body or metadata file, or parse metadata',
                    `Error: ${error}`,
                );
            }

            return;
        }

        try {
            await cacheHandler.set(
                cachePath,
                {
                    // @ts-expect-error
                    kind: 'ROUTE',
                    body,
                    headers: meta.headers,
                    status: meta.status,
                },
                { revalidate, neshca_lastModified: lastModified, tags: getTagsFromHeaders(meta.headers) },
            );
        } catch (error) {
            if (debug) {
                console.warn(
                    '[CacheHandler] [%s] %s %s',
                    'registerInitialCache',
                    'Failed to set route cache. Please check if the CacheHandler is configured correctly',
                    `Error: ${error}`,
                );
            }

            return;
        }
    }

    async function setPageCache(cachePath: string, router: Router, revalidate: Revalidate) {
        const pathToRouteFiles = path.join(serverDistDir, router, cachePath);

        const isAppRouter = router === 'app';

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
                    `Error: ${error}`,
                );
            }
            return;
        }

        let html: string | undefined;
        let pageData: string | object | undefined;
        let meta: RouteMetadata | undefined;

        try {
            [html, pageData, meta] = await Promise.all([
                fsPromises.readFile(`${pathToRouteFiles}.html`, 'utf-8'),
                fsPromises
                    .readFile(`${pathToRouteFiles}.${isAppRouter ? 'rsc' : 'json'}`, 'utf-8')
                    .then((data) => (isAppRouter ? data : (JSON.parse(data) as object))),
                isAppRouter
                    ? fsPromises
                          .readFile(`${pathToRouteFiles}.meta`, 'utf-8')
                          .then((data) => JSON.parse(data) as RouteMetadata)
                    : undefined,
            ]);
        } catch (error) {
            if (debug) {
                console.warn(
                    '[CacheHandler] [%s] %s %s',
                    'registerInitialCache',
                    'Failed to read page html, page data, or metadata file, or parse metadata',
                    `Error: ${error}`,
                );
            }

            return;
        }

        try {
            await cacheHandler.set(
                cachePath,
                {
                    // @ts-expect-error
                    kind: 'PAGE',
                    html,
                    pageData,
                    postponed: meta?.postponed,
                    headers: meta?.headers,
                    status: meta?.status,
                },
                { revalidate, neshca_lastModified: lastModified },
            );
        } catch (error) {
            if (debug) {
                console.warn(
                    '[CacheHandler] [%s] %s %s',
                    'registerInitialCache',
                    'Failed to set page cache. Please check if the CacheHandler is configured correctly',
                    `Error: ${error}`,
                );
            }

            return;
        }
    }

    for (const [cachePath, { dataRoute, initialRevalidateSeconds }] of Object.entries(prerenderManifest.routes)) {
        if (populatePages && dataRoute?.endsWith('.json')) {
            await setPageCache(cachePath, 'pages', initialRevalidateSeconds);
        } else if (populatePages && dataRoute?.endsWith('.rsc')) {
            await setPageCache(cachePath, 'app', initialRevalidateSeconds);
        } else if (populateRoutes && dataRoute === null) {
            await setRouteCache(cachePath, 'app', initialRevalidateSeconds);
        }
    }

    if (!populateFetch) {
        return;
    }

    let fetchFiles: string[];

    try {
        fetchFiles = await fsPromises.readdir(fetchCacheDir);
    } catch (error) {
        if (debug) {
            console.warn(
                '[CacheHandler] [%s] %s %s',
                'registerInitialCache',
                'Failed to read cache/fetch-cache directory',
                `Error: ${error}`,
            );
        }

        return;
    }

    for (const fetchCacheKey of fetchFiles) {
        const filePath = path.join(fetchCacheDir, fetchCacheKey);

        let lastModified: number | undefined;

        try {
            const stats = await fsPromises.stat(filePath);
            lastModified = stats.mtimeMs;
        } catch (error) {
            if (debug) {
                console.warn(
                    '[CacheHandler] [%s] %s %s',
                    'registerInitialCache',
                    'Failed to read fetch cache file',
                    `Error: ${error}`,
                );
            }
            return;
        }

        let fetchCache: CachedFetchValue;
        try {
            fetchCache = await fsPromises
                .readFile(filePath, 'utf-8')
                .then((data) => JSON.parse(data) as CachedFetchValue);
        } catch (error) {
            if (debug) {
                console.warn(
                    '[CacheHandler] [%s] %s %s',
                    'registerInitialCache',
                    'Failed to parse fetch cache file',
                    `Error: ${error}`,
                );
            }

            return;
        }

        // HACK: By default, Next.js sets the revalidate option to CACHE_ONE_YEAR if the revalidate option is set
        const revalidate = fetchCache.revalidate === CACHE_ONE_YEAR ? false : fetchCache.revalidate;

        try {
            // @ts-expect-error
            await cacheHandler.set(fetchCacheKey, fetchCache, {
                revalidate,
                neshca_lastModified: lastModified,
                tags: fetchCache.tags,
            });
        } catch (error) {
            if (debug) {
                console.warn(
                    '[CacheHandler] [%s] %s %s',
                    'registerInitialCache',
                    'Failed to set fetch cache. Please check if the CacheHandler is configured correctly',
                    `Error: ${error}`,
                );
            }
        }
    }
}
