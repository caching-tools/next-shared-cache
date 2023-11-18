import type { LRUCache } from 'lru-cache';
import type { LruCacheOptions } from '../create-configured-cache';
import { createConfiguredCache } from '../create-configured-cache';

function calculateStringSize(value: string): number {
    return value.length;
}

export function createCache(options?: LruCacheOptions): LRUCache<string, string> {
    return createConfiguredCache(calculateStringSize, options);
}
