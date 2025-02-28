import type { LRUCache } from 'lru-cache';

import type { LruCacheOptions } from '../create-configured-cache.js';
import { createConfiguredCache } from '../create-configured-cache.js';

function calculateStringSize(value: string): number {
  return value.length;
}

export default function createCacheStore(
  options?: LruCacheOptions,
): LRUCache<string, string> {
  return createConfiguredCache(calculateStringSize, options);
}
