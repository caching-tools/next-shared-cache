import TTLCache from '@isaacs/ttlcache';
import type { CacheHandlerValue, CacheHandlerParametersSet } from '@neshca/next-types';

type Revalidate = CacheHandlerParametersSet[2]['revalidate'];

export class Cache {
    private cache = new TTLCache<string, CacheHandlerValue>({ max: 500, checkAgeOnGet: true });

    get(key: string): CacheHandlerValue | undefined {
        return this.cache.get(key);
    }

    set(key: string, value: CacheHandlerValue, revalidate: Revalidate): void {
        let ttl = Infinity;

        if (typeof revalidate === 'number') {
            ttl = revalidate * 1000;
        }

        this.cache.set(key, value, { ttl });
    }

    delete(key: string): void {
        this.cache.delete(key);
    }
}
