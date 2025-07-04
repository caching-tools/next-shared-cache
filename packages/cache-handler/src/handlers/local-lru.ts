import { LRUCache } from 'lru-cache';
import { NEXT_CACHE_IMPLICIT_TAG_ID } from '../next-common-types.js';
import { CachedRouteKind } from '../next-common-types.js';
import type { Handler } from '../cache-handler.js';
import type { CacheHandlerValue } from '../next-common-types.js';

/**
 * Calculates the size of a cache item.
 *
 * @param cacheHandlerValue - The cache item to calculate the size of.
 *
 * @param cacheHandlerValue.value - The value of the cache item.
 *
 * @returns The size of the cache item.
 */
function calculateObjectSize({ value }: CacheHandlerValue): number {
  // Return default size if value is falsy
  if (!value) {
    return 25;
  }

  switch (value.kind) {
    case CachedRouteKind.REDIRECT: {
      // Calculate size based on the length of the stringified props
      return JSON.stringify(value.props).length;
    }
    case CachedRouteKind.IMAGE: {
      // Throw a specific error for image kind
      throw new Error(
        'Image kind should not be used for incremental-cache calculations.',
      );
    }
    case CachedRouteKind.FETCH: {
      // Calculate size based on the length of the stringified data
      return JSON.stringify(value.data).length;
    }
    case CachedRouteKind.APP_ROUTE: {
      // Size based on the length of the body
      return value.body.length;
    }
    case CachedRouteKind.PAGES: {
      return value.html.length + JSON.stringify(value.pageData).length;
    }
    case CachedRouteKind.APP_PAGE: {
      return value.html.length + (value.rscData?.length || 0);
    }
    default: {
      return 0;
    }
  }
}

/**
 * Creates a cache store.
 *
 * @param options - The options for the cache store.
 *
 * @returns A new instance of LRUCache.
 */
export function createCacheStore(
  options?: LruCacheOptions,
): LRUCache<string, CacheHandlerValue> {
  return createConfiguredCache(calculateObjectSize, options);
}

/**
 * Configuration options for the LRU cache.
 *
 * @since 1.0.0
 */
export type LruCacheOptions = {
  /**
   * Optional. Maximum number of items the cache can hold.
   *
   * @default 1000
   *
   * @since 1.0.0
   */
  maxItemsNumber?: number;
  /**
   * Optional. Maximum size in bytes for each item in the cache.
   *
   * @default 104857600 // 100 Mb
   *
   * @since 1.0.0
   */
  maxItemSizeBytes?: number;
};

const MAX_ITEMS_NUMBER = 1000;
const MAX_ITEM_SIZE_BYTES = 100 * 1024 * 1024;

const DEFAULT_OPTIONS: LruCacheOptions = {
  maxItemsNumber: MAX_ITEMS_NUMBER,
  maxItemSizeBytes: MAX_ITEM_SIZE_BYTES,
};

/**
 * Creates a configured LRUCache.
 *
 * @param calculateSizeCallback - A callback function to calculate the size of cache items.
 *
 * @param options - Optional configuration options for the cache.
 *
 * @param options.maxItemsNumber - The maximum number of items in the cache.
 *
 * @param options.maxItemSizeBytes - The maximum size in bytes for each item in the cache.
 *
 * @returns A new instance of LRUCache.
 */
export function createConfiguredCache<CacheValueType extends object | string>(
  calculateSizeCallback: (value: CacheValueType) => number,
  {
    maxItemsNumber = MAX_ITEMS_NUMBER,
    maxItemSizeBytes = MAX_ITEM_SIZE_BYTES,
  } = DEFAULT_OPTIONS,
): LRUCache<string, CacheValueType> {
  return new LRUCache<string, CacheValueType>({
    max: maxItemsNumber,
    maxSize: maxItemSizeBytes,
    sizeCalculation: calculateSizeCallback,
  });
}

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
export default function createHandler({
  ...lruOptions
}: LruCacheOptions = {}): Handler {
  const lruCacheStore = createCacheStore(lruOptions);

  const revalidatedTags = new Map<string, number>();

  return {
    name: 'local-lru',
    get(key, { implicitTags }): Promise<CacheHandlerValue | null | undefined> {
      const cacheValue = lruCacheStore.get(key);

      if (!cacheValue) {
        return Promise.resolve(null);
      }

      const sanitizedImplicitTags = implicitTags;

      const combinedTags = new Set([
        ...cacheValue.tags,
        ...sanitizedImplicitTags,
      ]);

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
    set(key, cacheHandlerValue): Promise<void> {
      lruCacheStore.set(key, cacheHandlerValue);

      return Promise.resolve();
    },
    revalidateTag(tag): Promise<void> {
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
    delete(key): Promise<void> {
      lruCacheStore.delete(key);

      return Promise.resolve();
    },
  };
}
