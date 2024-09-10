import { promises as fsPromises } from 'node:fs';
import path from 'node:path';
import type { CachedFetchValue } from '@neshca/next-common';
import { PRERENDER_MANIFEST, SERVER_DIRECTORY } from 'next/constants';
import type { PrerenderManifest } from 'next/dist/build';
import type { RouteMetadata } from 'next/dist/export/routes/types';
import { CACHE_ONE_YEAR } from 'next/dist/lib/constants';
import type { Revalidate } from 'next/dist/server/lib/revalidate';
import { getTagsFromHeaders } from '../helpers/get-tags-from-headers';

type CacheHandlerType = typeof import('../cache-handler').CacheHandler;

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

        if (prerenderManifest.version !== 4) {
            throw new Error('Invalid prerender manifest version. Expected version 4.');
        }
    } catch (error) {
        console.warn(
            '[CacheHandler] [%s] %s %s',
            'instrumentation.cache',
            'Failed to read prerender manifest',
            `Error: ${error}`,
        );
    }

    if (!prerenderManifest) {
        return;
    }

    const context = {
        serverDistDir,
        dev: process.env.NODE_ENV === 'development',
    };

    const cacheHandler = new CacheHandler(context as ConstructorParameters<typeof CacheHandler>[0]);

    type Router = 'pages' | 'app';
    type CacheKind = 'PAGE' | 'ROUTE';

    async function setCacheForRoute(route: string, router: Router, cacheKind: CacheKind, revalidate: Revalidate) {
        const pathToRouteFiles = path.join(serverDistDir, router, route);

        if (cacheKind === 'ROUTE') {
            let lastModified: number | undefined;

            try {
                const stats = await fsPromises.stat(`${pathToRouteFiles}.body`);
                lastModified = stats.mtimeMs;
            } catch (_) {
                return;
            }

            const [body, meta] = await Promise.all([
                fsPromises.readFile(`${pathToRouteFiles}.body`),
                fsPromises
                    .readFile(`${pathToRouteFiles}.meta`, 'utf-8')
                    .then((data) => JSON.parse(data) as RouteMetadata),
            ]);

            try {
                if (!(meta.headers && meta.status)) {
                    return;
                }

                await cacheHandler.set(
                    route,
                    {
                        kind: 'ROUTE',
                        body,
                        headers: meta.headers,
                        status: meta.status,
                    },
                    { revalidate, neshca_lastModified: lastModified, tags: getTagsFromHeaders(meta.headers) },
                );
            } catch (_) {
                return;
            }
        }

        const isAppRouter = router === 'app';

        let lastModified: number | undefined;

        try {
            const stats = await fsPromises.stat(`${pathToRouteFiles}.html`);
            lastModified = stats.mtimeMs;
        } catch (_) {
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
        } catch (_) {
            return;
        }

        try {
            await cacheHandler.set(
                route,
                {
                    kind: 'PAGE',
                    html,
                    pageData,
                    postponed: meta?.postponed,
                    headers: meta?.headers,
                    status: meta?.status,
                },
                { revalidate, neshca_lastModified: lastModified },
            );
        } catch (_) {
            return;
        }
    }

    for (const [route, { dataRoute, initialRevalidateSeconds }] of Object.entries(prerenderManifest.routes)) {
        let router: Router | undefined;
        let cacheKind: CacheKind | undefined;

        if (populatePages && dataRoute?.endsWith('.json')) {
            router = 'pages';
            cacheKind = 'PAGE';
        } else if (populatePages && dataRoute?.endsWith('.rsc')) {
            router = 'app';
            cacheKind = 'PAGE';
        } else if (populateRoutes && dataRoute === null) {
            router = 'app';
            cacheKind = 'ROUTE';
        }

        if (router && cacheKind) {
            await setCacheForRoute(route, router, cacheKind, initialRevalidateSeconds);
        }
    }

    if (!populateFetch) {
        return;
    }

    const fetchFiles = await fsPromises.readdir(fetchCacheDir);

    for (const fetchCacheKey of fetchFiles) {
        const filePath = path.join(fetchCacheDir, fetchCacheKey);

        let lastModified: number | undefined;

        try {
            const stats = await fsPromises.stat(filePath);
            lastModified = stats.mtimeMs;
        } catch (_) {
            return;
        }

        const fetchCache = await fsPromises
            .readFile(filePath, 'utf-8')
            .then((data) => JSON.parse(data) as CachedFetchValue);

        // HACK: By default, Next.js sets the revalidate option to CACHE_ONE_YEAR if the revalidate option is set
        const revalidate = fetchCache.revalidate === CACHE_ONE_YEAR ? false : fetchCache.revalidate;

        await cacheHandler.set(fetchCacheKey, fetchCache, {
            revalidate,
            neshca_lastModified: lastModified,
            tags: fetchCache.tags,
        });
    }
}
