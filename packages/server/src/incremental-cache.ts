import { LRUCache } from 'lru-cache';
import type { CacheGetCtx, CacheHandlerValue, CacheSetCtx, IncrementalCacheValue, TagsManifest } from './types';
import { getDerivedTags } from './get-derived-tags';

export class IncrementalCache {
    #revalidatedTags = new Set<string>();

    #tagsManifest: TagsManifest = { items: {}, version: 1 };

    #memoryCache = new LRUCache<string, CacheHandlerValue>({
        maxSize: 100 * 1024 * 1024, // ±100MB
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

    /**
     * get
     */
    public get(pathname: string, _context: CacheGetCtx): CacheHandlerValue | null {
        const cachedData = this.#memoryCache.get(pathname);

        if (!cachedData) {
            return null;
        }

        if (cachedData.value?.kind === 'FETCH') {
            const innerData = cachedData.value.data;
            const derivedTags = getDerivedTags(innerData.tags ?? []);

            const wasRevalidated = derivedTags.some((tag) => {
                if (this.#revalidatedTags.has(tag)) {
                    return true;
                }

                const item = this.#tagsManifest.items[tag];

                return item.revalidatedAt >= cachedData.lastModified;
            });
            // When revalidate tag is called we don't return
            // stale data so it's updated right away
            if (wasRevalidated) {
                return null;
            }
        }

        return cachedData;
    }

    /**
     * set
     */
    public set(pathname: string, data: IncrementalCacheValue | null, context: CacheSetCtx): void {
        this.#memoryCache.set(pathname, {
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
