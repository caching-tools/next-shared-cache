import TTLCache from '@isaacs/ttlcache';
import type { CacheHandlerValue, CacheHandlerParametersSet } from 'next-types';

type Revalidate = CacheHandlerParametersSet[2]['revalidate'];

export class Cache {
    #cache = new TTLCache<string, CacheHandlerValue>({ max: 500, checkAgeOnGet: true });

    get(key: string): CacheHandlerValue | undefined {
        return this.#cache.get(key);
    }

    set(key: string, value: CacheHandlerValue, revalidate: Revalidate): void {
        if (this.#cache.has(key)) {
            return;
        }

        let ttl = Infinity;

        if (typeof revalidate === 'number') {
            ttl = revalidate * 1000;
        }

        this.#cache.set(key, value, { ttl });
    }

    delete(key: string): void {
        this.#cache.delete(key);
    }

    has(key: string): boolean {
        return this.#cache.has(key);
    }
}
