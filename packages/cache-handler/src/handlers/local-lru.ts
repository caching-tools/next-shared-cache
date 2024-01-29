import type { LruCacheOptions } from '@neshca/next-lru-cache/next-cache-handler-value';
import { createCache } from '@neshca/next-lru-cache/next-cache-handler-value';

import type { Cache, CacheHandlerValue } from '../cache-handler';
import type { UseTtlOptions } from '../common-types';
import { calculateEvictionDelay } from '../helpers/calculate-eviction-delay';

export type LruCacheHandlerOptions = LruCacheOptions & UseTtlOptions;

/**
 * Creates an LRU (Least Recently Used) cache handler.
 *
 * This function initializes an LRU cache handler for managing cache operations.
 * It allows setting a maximum number of items and maximum item size in bytes.
 * The handler includes methods to get and set cache values.
 * Revalidation is handled by the `IncrementalCache` class.
 *
 * @param options - The configuration options for the LRU cache handler. See {@link LruCacheHandlerOptions}.
 *
 * @returns An object representing the cache, with methods for cache operations.
 *
 * @example
 * ```js
 * const lruCache = createLruCache({
 *   maxItemsNumber: 10000, // 10000 items
 *   maxItemSizeBytes: 1024 * 1024 * 500, // 500 MB
 *   useTtl: (maxAge) => maxAge * 1.5
 * });
 * ```
 *
 * @remarks
 * - Use this Handler as a fallback for any remote store Handler instead of the filesystem when you use only the App router.
 */
export default function createLruCache({ useTtl = false, ...lruOptions }: LruCacheHandlerOptions = {}): Cache {
    const lruCache = createCache(lruOptions);

    return {
        name: 'local-lru',
        get(key) {
            const cacheValue = lruCache.get(key);

            if (!cacheValue) {
                return Promise.resolve(null);
            }

            const { lastModified, maxAgeSeconds } = cacheValue;

            if (!useTtl || !maxAgeSeconds) {
                return Promise.resolve(cacheValue as CacheHandlerValue);
            }

            const ageSeconds = lastModified ? Math.floor((Date.now() - lastModified) / 1000) : 0;

            const evictionAge = calculateEvictionDelay(maxAgeSeconds, useTtl);

            if (!evictionAge || evictionAge > ageSeconds) {
                return Promise.resolve(cacheValue as CacheHandlerValue);
            }

            lruCache.delete(key);

            return Promise.resolve(null);
        },
        set(key, value, maxAgeSeconds) {
            lruCache.set(key, {
                ...value,
                maxAgeSeconds,
            });

            return Promise.resolve();
        },
    };
}
