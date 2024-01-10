/* eslint-disable import/no-default-export -- use default here */
import type { LruCacheOptions } from '@neshca/next-lru-cache/next-cache-handler-value';
import { createCache } from '@neshca/next-lru-cache/next-cache-handler-value';
import type { Cache } from '../cache-handler';
import { calculateEvictionDelay } from '../helpers/calculate-eviction-delay';
import type { UseTtlOptions } from '../common-types';
import { MAX_INT32 } from '../constants';

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
 * - The max TTL value is 2147483.647 seconds (24.8 days) due to a `setTimeout` limitation.
 */
export default function createLruCache({ useTtl = false, ...lruOptions }: LruCacheHandlerOptions = {}): Cache {
    const lruCache = createCache(lruOptions);

    return {
        name: 'local-lru',
        get(key) {
            return Promise.resolve(lruCache.get(key));
        },
        set(key, value, maxAgeSeconds = 0) {
            const evictionDelay = calculateEvictionDelay(maxAgeSeconds * 1000, useTtl);

            lruCache.set(key, value, evictionDelay ? { ttl: Math.min(evictionDelay, MAX_INT32) } : undefined);

            return Promise.resolve();
        },
    };
}
