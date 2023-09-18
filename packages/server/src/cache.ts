import TTLCache from '@isaacs/ttlcache';
import type { CacheHandlerValue } from './types';

export const CACHE_FOR_LONG = 31536000000;

export class Cache {
    #cache = new TTLCache<string, CacheHandlerValue>({ max: 10000, ttl: CACHE_FOR_LONG, checkAgeOnGet: true });

    get(key: string): CacheHandlerValue | undefined {
        return this.#cache.get(key);
    }

    set(key: string, value: CacheHandlerValue): void {
        const { revalidate } = value.ctx;

        let ttl: number | undefined;

        if (typeof revalidate === 'number') {
            ttl = revalidate * 1000;
        }

        this.#cache.set(key, value, { ttl });
    }
}
