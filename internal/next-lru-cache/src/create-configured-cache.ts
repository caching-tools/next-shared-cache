import { LRUCache } from 'lru-cache';

export type LruCacheOptions = {
    maxItemsNumber?: number;
    maxItemSizeBytes?: number;
};

const MAX_ITEMS_NUMBER = 1000;
const MAX_ITEM_SIZE_BYTES = 100 * 1024 * 1024;

const DEFAULT_OPTIONS: LruCacheOptions = {
    maxItemsNumber: MAX_ITEMS_NUMBER,
    maxItemSizeBytes: MAX_ITEM_SIZE_BYTES,
};

/**
 * Creates a configured LRU cache.
 *
 * @param calculateSizeCallback - A callback function to calculate the size of cache items.
 *
 * @param options - Optional configuration options for the cache.
 *
 * @returns A new instance of LRUCache.
 */
export function createConfiguredCache<CacheValueType extends object | string>(
    calculateSizeCallback: (value: CacheValueType) => number,
    { maxItemsNumber = MAX_ITEMS_NUMBER, maxItemSizeBytes = MAX_ITEM_SIZE_BYTES } = DEFAULT_OPTIONS,
): LRUCache<string, CacheValueType> {
    return new LRUCache<string, CacheValueType>({
        max: maxItemsNumber,
        maxSize: maxItemSizeBytes,
        sizeCalculation: calculateSizeCallback,
    });
}
