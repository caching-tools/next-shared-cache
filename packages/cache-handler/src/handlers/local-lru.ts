import type { LruCacheOptions } from '@neshca/next-lru-cache/next-cache-handler-value';
import { createCache } from '@neshca/next-lru-cache/next-cache-handler-value';
import type { Cache, CacheHandlerValue } from '../cache-handler';
import type { UseTtlOptions } from '../common-types';
import { checkIfAgeIsGreaterThatEvictionAge } from '../helpers/check-if-age-is-greater-that-eviction-age';

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
export default function createLruCache({ useTtl, ...lruOptions }: LruCacheHandlerOptions = {}): Cache {
    const lruCache = createCache(lruOptions);

    return {
        name: 'local-lru',
        get(key, maxAgeSeconds, globalUseTtl) {
            const cacheValue = lruCache.get(key);

            if (!cacheValue) {
                return Promise.resolve(null);
            }

            const { lastModified } = cacheValue;

            const currentUseTtl = typeof useTtl !== 'undefined' ? useTtl : globalUseTtl;

            if (!currentUseTtl || !maxAgeSeconds) {
                return Promise.resolve(cacheValue as CacheHandlerValue);
            }

            if (checkIfAgeIsGreaterThatEvictionAge(lastModified, maxAgeSeconds, currentUseTtl)) {
                lruCache.delete(key);

                return Promise.resolve(null);
            }

            return Promise.resolve(cacheValue as CacheHandlerValue);
        },
        set(key, value) {
            lruCache.set(key, value);

            return Promise.resolve();
        },
    };
}
