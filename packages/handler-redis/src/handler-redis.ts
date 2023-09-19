import type { CacheContext, CacheHandlerValue, IncrementalCacheValue } from 'server';
import type { RedisClientType, RedisClusterType } from 'redis';

export class RemoteCacheHandler {
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

    public async get(cacheKey: string, _ctx: CacheContext): Promise<CacheHandlerValue | null> {
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

    public async set(cacheKey: string, data: IncrementalCacheValue | null, ctx: CacheContext): Promise<void> {
        const { revalidate } = ctx;

        let ttl: number | undefined;

        if (typeof revalidate === 'number') {
            ttl = revalidate;
        }

        const value: CacheHandlerValue = { ctx, lastModified: Date.now(), value: data };

        await RemoteCacheHandler.#redisClient?.set(this.prefixCacheKey(cacheKey), JSON.stringify(value), {
            EX: ttl,
            NX: true,
        });
    }

    // public async revalidateTag(tag: string): Promise<void> {
    //     const requestInit: RequestInit = {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json; charset=utf-8' },
    //         body: JSON.stringify({ tag }),
    //     };

    //     const url = `http://${host}:${port}/revalidateTag`;

    //     await fetch(url, requestInit);
    // }
}
