import type {
    UnwrappedCacheHandler,
    CacheHandlerValue,
    CacheHandlerParametersSet,
    CacheHandlerParametersGet,
    CacheHandlerParametersRevalidateTag,
} from 'next-types';
import { Cache } from './cache';

export class IncrementalCache implements UnwrappedCacheHandler {
    #revalidatedTags = new Set<string>();

    // #tagsManifest: TagsManifest = { items: {}, version: 1 };

    #memoryCache = new Cache();

    /**
     * get
     */
    get(...args: CacheHandlerParametersGet): CacheHandlerValue | null {
        const [cacheKey] = args;

        const cachedData = this.#memoryCache.get(cacheKey);

        if (!cachedData) {
            return null;
        }

        return cachedData;
    }

    /**
     * set
     */
    set(...args: CacheHandlerParametersSet): void {
        const [cacheKey, data, ctx] = args;

        this.#memoryCache.set(
            cacheKey,
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
    public revalidateTag(...args: CacheHandlerParametersRevalidateTag): void {
        const [tag] = args;

        this.#revalidatedTags.add(tag);
    }
}
