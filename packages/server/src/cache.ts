import TTLCache from '@isaacs/ttlcache';
import type { CacheHandlerValue, CacheHandlerParametersSet } from 'next-types';

type Revalidate = CacheHandlerParametersSet[2]['revalidate'];

export const CACHE_FOR_LONG = 31536000000;

export class Cache {
    #cache = new TTLCache<string, CacheHandlerValue>({ max: 10000, ttl: CACHE_FOR_LONG, checkAgeOnGet: true });

    get(key: string): CacheHandlerValue | undefined {
        return this.#cache.get(key);
    }

    set(key: string, value: CacheHandlerValue, revalidate: Revalidate): void {
        let ttl: number | undefined;

        if (typeof revalidate === 'number') {
            ttl = revalidate * 1000;
        }

        this.#cache.set(key, value, { ttl });
    }
}
