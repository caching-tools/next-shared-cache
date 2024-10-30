import type { LruCacheOptions } from '@repo/next-lru-cache/next-cache-handler-value';
import createCacheStore from '@repo/next-lru-cache/next-cache-handler-value';

import type { NextCacheImplicitTagId } from '@repo/next-common';
import type { Handler } from '../cache-handler';

const NEXT_CACHE_IMPLICIT_TAG_ID: NextCacheImplicitTagId = '_N_T_';

/**
 * @deprecated Use {@link LruCacheOptions} instead.
 */
export type LruCacheHandlerOptions = LruCacheOptions;

export type { LruCacheOptions };

/**
 * Creates an LRU (Least Recently Used) cache Handler.
 *
 * This function initializes an LRU cache handler for managing cache operations.
 * It allows setting a maximum number of items and maximum item size in bytes.
 * The handler includes methods to get and set cache values.
 * Revalidation is handled by the `CacheHandler` class.
 *
 * @param options - The configuration options for the LRU cache handler. See {@link LruCacheOptions}.
 *
 * @returns An object representing the cache, with methods for cache operations.
 *
 * @example
 * ```js
 * const lruHandler = createLruHandler({
 *   maxItemsNumber: 10000, // 10000 items
 *   maxItemSizeBytes: 1024 * 1024 * 500, // 500 MB
 * });
 * ```
 *
 * @remarks
 * - Use this Handler as a fallback for any remote store Handler.
 *
 * @since 1.0.0
 */
export default function createHandler({ ...lruOptions }: LruCacheOptions = {}): Handler {
    const lruCacheStore = createCacheStore(lruOptions);

    const revalidatedTags = new Map<string, number>();

    return {
        name: 'local-lru',
        get(key, { implicitTags }) {
            const cacheValue = lruCacheStore.get(key);

            if (!cacheValue) {
                return Promise.resolve(null);
            }

            const sanitizedImplicitTags = implicitTags;

            const combinedTags = new Set([...cacheValue.tags, ...sanitizedImplicitTags]);

            if (combinedTags.size === 0) {
                return Promise.resolve(cacheValue);
            }

            for (const tag of combinedTags) {
                const revalidationTime = revalidatedTags.get(tag);

                if (revalidationTime && revalidationTime > cacheValue.lastModified) {
                    lruCacheStore.delete(key);

                    return Promise.resolve(null);
                }
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

            if (tag.startsWith(NEXT_CACHE_IMPLICIT_TAG_ID)) {
                revalidatedTags.set(tag, Date.now());
            }

            return Promise.resolve();
        },
        delete(key) {
            lruCacheStore.delete(key);

            return Promise.resolve();
        },
    };
}
