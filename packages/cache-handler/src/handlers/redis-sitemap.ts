import { promises as fsPromises } from 'node:fs';
import type { Handler } from '../cache-handler';
import type { CreateRedisSitemapHandlerOptions } from '../common-types';

import path from 'node:path';
import type { PrerenderManifest } from '@neshca/next-common';
import { getTimeoutRedisCommandOptions } from '../helpers/get-timeout-redis-command-options';

export type { CreateRedisSitemapHandlerOptions };

const debug = typeof process.env.NEXT_PRIVATE_DEBUG_CACHE !== 'undefined';

/**
 * Creates a utility Handler that uses the Redis client to store pre-rendered and dynamic pages,
 * excluding API routes and SSR pages.
 * It also keeps track of their last modified timestamps for Pages and App Routes.
 * This can make generating the same sitemap in distributed environments easier.
 *
 * On the first run of the application, it populates the cache with the pre-rendered pages.
 * In the runtime, it updates or adds the last modified timestamp of the page.
 *
 * Use `keyPrefix + sitemapKey` to access the data inside a [`sitemap.(xml|js|ts)`](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap) file to generate a sitemap.
 *
 * @param options - The configuration options for the Redis Handler. See {@link CreateRedisSitemapHandlerOptions}.
 *
 * @returns An object representing the Handler.
 *
 * @example
 *
 * ### Create a Handler
 * ```js
 * // cache-handler.js
 * // ...
 * const redisClient = createRedisClient(...);
 *
 * const sitemapHandler = createSitemapHandler({
 *   client: redisClient,
 *   keyPrefix: 'myApp:',
 *   sitemapKey: '__sitemap__',
 * });
 * // ...
 * ```
 *
 * ### Access the sitemap data
 *
 * ```ts
 * // src/app/sitemap.ts
 *
 * import { getTimeoutRedisCommandOptions, promiseWithTimeout } from '@neshca/cache-handler/helpers';
 * import type { MetadataRoute } from 'next';
 * import { createClient } from 'redis';
 *
 * export const dynamic = 'force-dynamic';
 *
 * export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
 *   const client = createClient({
 *     url: process.env.REDIS_URL,
 *   });
 *
 *   await promiseWithTimeout(client.connect(), 1000);
 *
 *   const sitemap: MetadataRoute.Sitemap = [];
 *
 *   let currentCursor = 0;
 *
 *   do {
 *     if (client.isReady === false) {
 *       throw new Error('Redis client is not ready yet or connection is lost. Keep trying...');
 *     }
 *
 *     const options = getTimeoutRedisCommandOptions(1000);
 *
 *     // The second argument is the keyPrefix + sitemapKey
 *     const { cursor, tuples } = await client.hScan(options, '__sitemap__', currentCursor, { COUNT: 100 });
 *
 *     currentCursor = cursor;
 *
 *     for (const { field, value } of tuples) {
 *       const url = new URL(field, 'https://example.com');
 *
 *       sitemap.push({
 *         url: url.href,
 *         lastModified: new Date(Number.parseInt(value)),
 *         priority: 0.5,
 *         changeFrequency: 'always',
 *       });
 *     }
 *   } while (currentCursor !== 0);
 *
 *   await client.quit();
 *
 *   return sitemap;
 * }
 *
 * ```
 *
 * @remarks
 * - the `get` method throws an error because the sitemap data is not accessible.
 * - the `revalidateTag` method throws an error because the sitemap data is not tag-based.
 * - the URLs in the sitemap are relative to the origin without a `basePath` and `trailingSlash`.
 *
 * @since 1.4.0
 */
export default function createHandler({
    client,
    keyPrefix = '',
    timeoutMs = 5000,
    sitemapKey = '__sitemap__',
    serverDistDir,
}: CreateRedisSitemapHandlerOptions): Handler {
    function assertClientIsReady(): void {
        if (!client.isReady) {
            throw new Error('Redis client is not ready yet or connection is lost. Keep trying...');
        }
    }

    async function populateCacheOnBackground(): Promise<void> {
        let prerenderManifest: PrerenderManifest | null = null;

        let lastModified = Date.now();

        if (serverDistDir) {
            try {
                const prerenderManifestData = await fsPromises.readFile(
                    path.join(serverDistDir, '..', 'prerender-manifest.json'),
                    'utf-8',
                );

                const { mtimeMs } = await fsPromises.stat(path.join(serverDistDir, '..', 'prerender-manifest.json'));

                // We assume that the prerender-manifest.json was created at the same time as the pages.
                lastModified = Math.floor(mtimeMs);

                prerenderManifest = JSON.parse(prerenderManifestData) as PrerenderManifest;
            } catch (_error) {}
        }

        if (prerenderManifest) {
            // Reading and parsing always gives us new array. So, we can safely mutate it.
            const prerenderedPages: string[] = prerenderManifest.notFoundRoutes;

            for (const [route, { dataRoute }] of Object.entries(prerenderManifest.routes)) {
                // Only pages has dataRoute
                if (dataRoute) {
                    prerenderedPages.push(route);
                }
            }

            for (const prerenderedPage of prerenderedPages) {
                assertClientIsReady();

                const options = getTimeoutRedisCommandOptions(timeoutMs);

                // Since we use the `hSetNX` command, we can not set multiple keys at once.
                await client.hSetNX(options, keyPrefix + sitemapKey, prerenderedPage, lastModified.toString(10));
            }
        }
    }

    // We don't need to wait for the cache to be populated.
    // So, we use a Promise without `await`
    populateCacheOnBackground()
        .then(() => {
            if (debug) {
                console.info('Sitemap data populated successfully.');
            }
        })
        .catch((error) => {
            if (debug) {
                console.warn('Failed to populate sitemap data.', error);
            }
        });

    return {
        name: 'redis-sitemap',
        get() {
            throw new Error('redis-sitemap does not support get method. Passing through...');
        },
        async set(key, cacheHandlerValue) {
            if (cacheHandlerValue.value?.kind !== 'PAGE') {
                return;
            }

            assertClientIsReady();

            const options = getTimeoutRedisCommandOptions(timeoutMs);

            await client.hSet(options, keyPrefix + sitemapKey, key, cacheHandlerValue.lastModified);
        },
        revalidateTag() {
            throw new Error('redis-sitemap does not support revalidateTag method. Passing through...');
        },
    };
}
