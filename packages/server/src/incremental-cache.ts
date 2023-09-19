import type { UnwrappedCacheHandler, CacheHandlerValue, IncrementalCacheValue } from 'next-types';
import { Cache } from './cache';

export class IncrementalCache implements UnwrappedCacheHandler {
    #revalidatedTags = new Set<string>();

    // #tagsManifest: TagsManifest = { items: {}, version: 1 };

    #memoryCache = new Cache();

    /**
     * get
     */
    get(cacheKey: string): CacheHandlerValue | null {
        const cachedData = this.#memoryCache.get(cacheKey);

        if (!cachedData) {
            return null;
        }

        return cachedData;
    }

    /**
     * set
     */
    set(
        pathname: string,
        data: IncrementalCacheValue | null,
        ctx: {
            revalidate?: number | false;
            fetchCache?: boolean;
            fetchUrl?: string;
            fetchIdx?: number;
            tags?: string[];
        },
    ): void {
        this.#memoryCache.set(
            pathname,
            {
                value: data,
                lastModified: Date.now(),
            },
            ctx.revalidate,
        );
    }

    /**
     * revalidatedTags
     */
    public revalidateTag(tag: string): void {
        this.#revalidatedTags.add(tag);
    }
}
