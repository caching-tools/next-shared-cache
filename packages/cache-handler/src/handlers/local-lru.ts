import type { LruCacheOptions } from '@neshca/next-lru-cache/next-cache-handler-value';
import { createCache } from '@neshca/next-lru-cache/next-cache-handler-value';

import type { Handler } from '../cache-handler';

export type LruCacheHandlerOptions = LruCacheOptions;

/**
 * Creates an LRU (Least Recently Used) cache handler.
 *
 * This function initializes an LRU cache handler for managing cache operations.
 * It allows setting a maximum number of items and maximum item size in bytes.
 * The handler includes methods to get and set cache values.
 * Revalidation is handled by the `CacheHandler` class.
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
 * });
 * ```
 *
 * @remarks
 * - Use this Handler as a fallback for any remote store Handler instead of the filesystem when you use only the App router.
 */
export default function createLruCache({ ...lruOptions }: LruCacheHandlerOptions = {}): Handler {
    const lruCacheStore = createCache(lruOptions);

    return {
        name: 'local-lru',
        get(key) {
            const cacheValue = lruCacheStore.get(key);

            if (!cacheValue) {
                return Promise.resolve(null);
            }

            return Promise.resolve(cacheValue);
        },
        set(key, cacheHandlerValue) {
            lruCacheStore.set(key, cacheHandlerValue);

            return Promise.resolve();
        },
        revalidateTag(tag) {
            // Iterate over all entries in the cache
            for (const [key, { tags }] of lruCacheStore.entries()) {
                // If the value's tags include the specified tag, delete this entry
                if (tags.includes(tag)) {
                    lruCacheStore.delete(key);
                }
            }

            return Promise.resolve();
        },
        delete(key) {
            lruCacheStore.delete(key);

            return Promise.resolve();
        },
    };
}
