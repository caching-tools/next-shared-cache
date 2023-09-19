import type { RedisClientType, RedisClusterType } from 'redis';
import type { CacheHandler, CacheHandlerValue, IncrementalCacheValue } from 'next-types';

export class RemoteCacheHandler implements CacheHandler {
    static #redisClient: RedisClientType | RedisClusterType | null = null;

    static #prefix = '';

    static setRedisClient(client: RedisClientType | RedisClusterType): void {
        this.#redisClient = client;
    }

    static setPrefix(prefix: string): void {
        this.#prefix = prefix;
    }

    static async connect(): Promise<void> {
        await this.#redisClient?.connect();
    }

    static async disconnect(): Promise<void> {
        await this.#redisClient?.disconnect();
    }

    prefixCacheKey(cacheKey: string): string {
        return `${RemoteCacheHandler.#prefix}${cacheKey}`;
    }

    public async get(
        cacheKey: string,
        _ctx?: {
            fetchCache?: boolean;
            revalidate?: number | false;
            fetchUrl?: string;
            fetchIdx?: number;
            tags?: string[];
            softTags?: string[];
        },
    ): Promise<CacheHandlerValue | null> {
        const result = await RemoteCacheHandler.#redisClient?.get(this.prefixCacheKey(cacheKey));

        if (!result) {
            return null;
        }

        try {
            return JSON.parse(result) as CacheHandlerValue;
        } catch (error) {
            // pass null
        }

        return null;
    }

    public async set(
        pathname: string,
        data: IncrementalCacheValue | null,
        ctx: {
            revalidate?: number | false;
            fetchCache?: boolean;
            fetchUrl?: string;
            fetchIdx?: number;
            tags?: string[];
        },
    ): Promise<void> {
        const { revalidate } = ctx;

        let ttl: number | undefined;

        if (typeof revalidate === 'number') {
            ttl = revalidate;
        }

        const value: CacheHandlerValue = { lastModified: Date.now(), value: data };

        await RemoteCacheHandler.#redisClient?.set(this.prefixCacheKey(pathname), JSON.stringify(value), {
            EX: ttl,
            NX: true,
        });
    }

    public async revalidateTag(_tag: string): Promise<void> {
        // pass
    }
}
