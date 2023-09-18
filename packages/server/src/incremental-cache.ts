import type { CacheContext, CacheHandlerValue, IncrementalCacheValue } from './types';
import { Cache } from './cache';

export class IncrementalCache {
    #revalidatedTags = new Set<string>();

    // #tagsManifest: TagsManifest = { items: {}, version: 1 };

    #memoryCache = new Cache();

    /**
     * get
     */
    public get(cacheKey: string, _context: CacheContext): CacheHandlerValue | null {
        const cachedData = this.#memoryCache.get(cacheKey);

        if (!cachedData) {
            return null;
        }

        return cachedData;
    }

    /**
     * set
     */
    public set(cacheKey: string, data: IncrementalCacheValue | null, context: CacheContext): void {
        this.#memoryCache.set(cacheKey, {
            value: data,
            lastModified: Date.now(),
            ctx: context,
        });
    }

    /**
     * revalidatedTags
     */
    public revalidateTags(tag: string): void {
        this.#revalidatedTags.add(tag);
    }
}
