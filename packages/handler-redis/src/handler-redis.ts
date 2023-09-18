import type { CacheContext, CacheHandlerValue, IncrementalCacheValue } from 'server';
import { createClient } from 'redis';

const client = createClient({
    url: process.env.REDIS_URL,
});

client.on('error', (err) => {
    console.log('Redis Client Error', err);
});

export class RemoteCacheHandler {
    public static async connect(): Promise<void> {
        await client.connect();
    }
    public async get(cacheKey: string, _ctx: CacheContext): Promise<CacheHandlerValue | null> {
        const result = await client.get(cacheKey);

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

        await client.set(cacheKey, JSON.stringify(value), { EX: ttl });
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
