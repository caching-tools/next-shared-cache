import type { RedisClientType, RedisClusterType } from 'redis';
import {
    NEXT_CACHE_TAGS_HEADER,
    type CacheHandler,
    type CacheHandlerParametersGet,
    type CacheHandlerParametersRevalidateTag,
    type CacheHandlerParametersSet,
    type CacheHandlerValue,
    type TagsManifest,
    type CacheHandlerContext,
} from 'next-types';

export class RemoteCacheHandler implements CacheHandler {
    revalidatedTags: string[] = [];

    public constructor(context: CacheHandlerContext) {
        this.revalidatedTags = context.revalidatedTags;
    }

    private static redisClient: RedisClientType | RedisClusterType | null = null;

    private static prefix = '';

    public static setRedisClient(client: RedisClientType | RedisClusterType): void {
        this.redisClient = client;
    }

    public static setPrefix(prefix: string): void {
        this.prefix = prefix;
    }

    public static async connect(): Promise<void> {
        await this.redisClient?.connect();
    }

    public static async disconnect(): Promise<void> {
        await this.redisClient?.disconnect();
    }

    private static prefixCacheKey(cacheKey: string): string {
        return `${this.prefix}${cacheKey}`;
    }

    private static async getTagsManifest(): Promise<TagsManifest> {
        const tagsManifest = await this.redisClient?.hGetAll(this.prefixCacheKey('tagsManifest'));

        if (!tagsManifest) {
            return { version: 1, items: {} };
        }

        const items: TagsManifest['items'] = {};

        Object.entries(tagsManifest).forEach(([tag, revalidatedAt]) => {
            items[tag] = { revalidatedAt: parseInt(revalidatedAt ?? '0', 10) };
        });

        return { version: 1, items };
    }

    public async get(...args: CacheHandlerParametersGet): Promise<CacheHandlerValue | null> {
        const [cacheKey, ctx = {}] = args;

        const { tags = [], softTags = [] } = ctx;

        const prefixedCacheKey = RemoteCacheHandler.prefixCacheKey(cacheKey);

        const result = await RemoteCacheHandler.redisClient?.get(prefixedCacheKey);

        if (!result) {
            return null;
        }

        let cachedData: CacheHandlerValue;

        try {
            cachedData = JSON.parse(result) as CacheHandlerValue;
        } catch (error) {
            return null;
        }

        if (cachedData.value?.kind === 'PAGE') {
            let cacheTags: undefined | string[];
            const tagsHeader = cachedData.value.headers?.[NEXT_CACHE_TAGS_HEADER as string];

            if (typeof tagsHeader === 'string') {
                cacheTags = tagsHeader.split(',');
            }

            const tagsManifest = await RemoteCacheHandler.getTagsManifest();

            if (cacheTags?.length) {
                const isStale = cacheTags.some((tag) => {
                    const revalidatedAt = tagsManifest.items[tag]?.revalidatedAt;

                    return revalidatedAt && revalidatedAt >= (cachedData.lastModified || Date.now());
                });

                // we trigger a blocking validation if an ISR page
                // had a tag revalidated, if we want to be a background
                // revalidation instead we return cachedData.lastModified = -1
                if (isStale) {
                    await RemoteCacheHandler.redisClient?.del(prefixedCacheKey);

                    return null;
                }
            }
        }

        if (cachedData.value?.kind === 'FETCH') {
            const combinedTags = [...tags, ...softTags];

            const tagsManifest = await RemoteCacheHandler.getTagsManifest();

            const wasRevalidated = combinedTags.some((tag: string) => {
                if (this.revalidatedTags.includes(tag)) {
                    return true;
                }

                const revalidatedAt = tagsManifest.items[tag]?.revalidatedAt;

                return revalidatedAt && revalidatedAt >= (cachedData.lastModified || Date.now());
            });
            // When revalidate tag is called we don't return
            // stale cachedData so it's updated right away
            if (wasRevalidated) {
                await RemoteCacheHandler.redisClient?.del(prefixedCacheKey);

                return null;
            }
        }

        return cachedData;
    }

    public async set(...args: CacheHandlerParametersSet): Promise<void> {
        const [cacheKey, data, ctx] = args;

        const { revalidate } = ctx;

        let ttl: number | undefined;

        if (typeof revalidate === 'number') {
            ttl = revalidate;
        }

        const value: CacheHandlerValue = { lastModified: Date.now(), value: data };

        await RemoteCacheHandler.redisClient?.set(RemoteCacheHandler.prefixCacheKey(cacheKey), JSON.stringify(value), {
            EX: ttl,
        });
    }

    public async revalidateTag(...args: CacheHandlerParametersRevalidateTag): Promise<void> {
        const [tag] = args;

        const options = {
            [tag]: Date.now(),
        };

        await RemoteCacheHandler.redisClient?.hSet(RemoteCacheHandler.prefixCacheKey('tagsManifest'), options);
    }
}
