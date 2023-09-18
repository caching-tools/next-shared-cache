import type { RequestInit } from 'undici';
import { fetch } from 'undici';
import type { CacheContext, CacheHandlerValue, IncrementalCacheValue } from 'server';

const port = Number.parseInt(process.env.REMOTE_CACHE_HANDLER_PORT ?? '8080', 10);

const host = process.env.REMOTE_CACHE_HANDLER_HOST ?? '[::]';

export class RemoteCacheHandler {
    public async get(cacheKey: string, ctx: CacheContext): Promise<CacheHandlerValue | null> {
        const requestInit: RequestInit = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
                cacheKey,
                ctx,
            }),
        };

        const url = `http://${host}:${port}/get`;

        const result = await fetch(url, requestInit);

        if (!result.ok) {
            return null;
        }

        try {
            return (await result.json()) as CacheHandlerValue;
        } catch (error) {
            // pass null
        }

        return null;
    }

    public async set(cacheKey: string, data: IncrementalCacheValue | null, ctx: CacheContext): Promise<void> {
        const requestInit: RequestInit = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
                cacheKey,
                data,
                ctx,
            }),
        };

        const url = `http://${host}:${port}/set`;

        await fetch(url, requestInit);
    }

    public async revalidateTag(tag: string): Promise<void> {
        const requestInit: RequestInit = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({ tag }),
        };

        const url = `http://${host}:${port}/revalidateTag`;

        await fetch(url, requestInit);
    }
}
