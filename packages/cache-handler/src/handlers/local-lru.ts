/* eslint-disable import/no-default-export -- use default here */
/* eslint-disable camelcase -- unstable__* */
/* eslint-disable no-console -- log errors */
import type { LruCacheOptions } from '@neshca/next-lru-cache/next-cache-handler-value';
import { createCache } from '@neshca/next-lru-cache/next-cache-handler-value';
import type { Cache } from '../cache-handler';
import type { CacheHandlerOptions } from '../common-types';

export type LruCacheHandlerOptions = CacheHandlerOptions &
    LruCacheOptions & {
        /**
         * Optional. Enables ttl support. Defaults to `false`.
         */
        useTtl?: boolean;
    };

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
 *   unstable__logErrors: true
 * });
 * ```
 *
 * @remarks
 * Use this Handler as a fallback for Redis Handler instead of the filesystem when you use only the App router.
 */
export default function createLruCache({
    unstable__logErrors,
    useTtl,
    ...lruOptions
}: LruCacheHandlerOptions = {}): Cache {
    const lruCache = createCache(lruOptions);

    return {
        get(key) {
            try {
                return Promise.resolve(lruCache.get(key));
            } catch (error) {
                if (unstable__logErrors) {
                    console.error('cache.get', error);
                }

                return Promise.resolve(null);
            }
        },
        set(key, value, ttl = 0) {
            try {
                lruCache.set(key, value, useTtl ? { ttl: ttl * 1000 } : undefined);
            } catch (error) {
                if (unstable__logErrors) {
                    console.error('cache.set', error);
                }
            }

            return Promise.resolve();
        },
    };
}
