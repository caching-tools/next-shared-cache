import { LRUCache } from 'lru-cache';
import TTLCache from '@isaacs/ttlcache';
import type { CacheHandlerValue, IncrementalCacheValue } from './types';

type CacheType = 'lru' | 'ttl' | 'map';

type LRUCaching = {
    cache: LRUCache<string, CacheHandlerValue>;
    type: 'lru';
};

type TTLCaching = {
    cache: TTLCache<string, CacheHandlerValue>;
    type: 'ttl';
};

type MapCaching = {
    cache: Map<string, CacheHandlerValue>;
    type: 'map';
};

export class Cache {
    #caching: LRUCaching | TTLCaching | MapCaching;

    constructor(cacheType: CacheType = (process.env.CACHE_TYPE ?? 'lru') as CacheType) {
        switch (cacheType) {
            case 'ttl': {
                const cache = new TTLCache<string, CacheHandlerValue>();

                this.#caching = { cache, type: cacheType };

                break;
            }
            case 'map': {
                const cache = new Map<string, CacheHandlerValue>();

                this.#caching = { cache, type: cacheType };

                break;
            }
            case 'lru':
            default: {
                const maxSize = process.env.LRU_CACHE_SIZE
                    ? Number.parseInt(process.env.LRU_CACHE_SIZE)
                    : 100 * 1024 * 1024; // Default ~100MB

                const cache = new LRUCache<string, CacheHandlerValue>({
                    maxSize,
                    sizeCalculation({ value }) {
                        if (!value) {
                            return 25;
                        }

                        switch (value.kind) {
                            case 'FETCH': {
                                return JSON.stringify(value.data).length;
                            }
                            case 'IMAGE': {
                                throw new Error('invariant image should not be incremental-cache');
                            }
                            case 'PAGE': {
                                return value.html.length + (JSON.stringify(value.pageData).length || 0);
                            }
                            case 'REDIRECT': {
                                return JSON.stringify(value.props).length;
                            }
                            case 'ROUTE': {
                                return value.body.data.length;
                            }
                            default: {
                                return 25;
                            }
                        }
                    },
                });

                this.#caching = { cache, type: cacheType };

                break;
            }
        }
    }

    get(key: string): CacheHandlerValue | undefined {
        return this.#caching.cache.get(key);
    }

    set(key: string, value: IncrementalCacheValue | null): void {
        if (this.#caching.type === 'ttl') {
            this.#caching.cache.set(key, { ctx: {}, value, lastModified: Date.now() }, { ttl: Infinity });

            return;
        }

        this.#caching.cache.set(key, {
            ctx: {},
            value,
            lastModified: Date.now(),
        });
    }
}
