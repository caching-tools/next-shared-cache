import type { RequestInit } from 'undici';
import { fetch } from 'undici';
import type { CacheHandler, CacheHandlerValue, IncrementalCacheValue } from 'next-types';

const baseUrl = process.env.REMOTE_CACHE_HANDLER_URL ?? 'http://[::]:8080';

export class RemoteCacheHandler implements CacheHandler {
    public async get(
        cacheKey: string,
        ctx?: {
            fetchCache?: boolean;
            revalidate?: number | false;
            fetchUrl?: string;
            fetchIdx?: number;
            tags?: string[];
            softTags?: string[];
        },
    ): Promise<CacheHandlerValue | null> {
        const requestInit: RequestInit = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify([cacheKey, ctx]),
        };

        const url = new URL('/get', baseUrl);

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
        const requestInit: RequestInit = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify([pathname, data, ctx]),
        };

        const url = new URL('/set', baseUrl);

        await fetch(url, requestInit);
    }

    public async revalidateTag(tag: string): Promise<void> {
        const requestInit: RequestInit = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify([tag]),
        };

        const url = new URL('/revalidateTag', baseUrl);

        await fetch(url, requestInit);
    }
}
