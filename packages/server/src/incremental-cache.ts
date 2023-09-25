import {
    type UnwrappedCacheHandler,
    type CacheHandlerValue,
    type CacheHandlerParametersSet,
    type CacheHandlerParametersGetWithTags,
    type CacheHandlerParametersRevalidateTag,
    type TagsManifest,
    NEXT_CACHE_TAGS_HEADER,
} from 'next-types';
import { Cache } from './cache';

export class IncrementalCache implements UnwrappedCacheHandler {
    private tagsManifest: TagsManifest = { items: {}, version: 1 };

    private memoryCache = new Cache();

    /**
     * get
     */
    public get(...args: CacheHandlerParametersGetWithTags): CacheHandlerValue | null {
        const [cacheKey, ctx = {}, revalidatedTags = []] = args;

        const { tags = [], softTags = [] } = ctx;

        const cachedData = this.memoryCache.get(cacheKey);

        if (!cachedData) {
            return null;
        }

        if (cachedData.value?.kind === 'PAGE') {
            let cacheTags: undefined | string[];
            const tagsHeader = cachedData.value.headers?.[NEXT_CACHE_TAGS_HEADER as string];

            if (typeof tagsHeader === 'string') {
                cacheTags = tagsHeader.split(',');
            }

            const tagsManifest = this.tagsManifest;

            if (cacheTags?.length) {
                const isStale = cacheTags.some((tag) => {
                    const revalidatedAt = tagsManifest.items[tag]?.revalidatedAt;

                    return revalidatedAt && revalidatedAt >= (cachedData.lastModified || Date.now());
                });

                // we trigger a blocking validation if an ISR page
                // had a tag revalidated, if we want to be a background
                // revalidation instead we return cachedData.lastModified = -1
                if (isStale) {
                    this.memoryCache.delete(cacheKey);

                    return null;
                }
            }
        }

        if (cachedData.value?.kind === 'FETCH') {
            const combinedTags = [...tags, ...softTags];

            const tagsManifest = this.tagsManifest;

            const wasRevalidated = combinedTags.some((tag: string) => {
                if (revalidatedTags.includes(tag)) {
                    return true;
                }

                const revalidatedAt = tagsManifest.items[tag]?.revalidatedAt;

                return revalidatedAt && revalidatedAt >= (cachedData.lastModified || Date.now());
            });
            // When revalidate tag is called we don't return
            // stale cachedData so it's updated right away
            if (wasRevalidated) {
                this.memoryCache.delete(cacheKey);

                return null;
            }
        }

        return cachedData;
    }

    /**
     * set
     */
    public set(...args: CacheHandlerParametersSet): void {
        const [cacheKey, data, ctx] = args;

        this.memoryCache.set(
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

        this.tagsManifest.items[tag] = { revalidatedAt: Date.now() };
    }
}
