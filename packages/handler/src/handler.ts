import type { RequestInit } from 'undici';
import { fetch } from 'undici';
import type {
    CacheHandler,
    CacheHandlerParametersGet,
    CacheHandlerParametersRevalidateTag,
    CacheHandlerParametersSet,
    CacheHandlerValue,
} from 'next-types';

const baseUrl = process.env.REMOTE_CACHE_HANDLER_URL ?? 'http://[::]:8080';

export class RemoteCacheHandler implements CacheHandler {
    public async get(...args: CacheHandlerParametersGet): Promise<CacheHandlerValue | null> {
        const requestInit: RequestInit = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify(args),
        };

        const url = new URL('/get', baseUrl);

        const result = await fetch(url, requestInit);

        if (!result.ok) {
            return null;
        }

        try {
            return (await result.json()) as CacheHandlerValue;
        } catch (error) {
            return null;
        }
    }

    public async set(...args: CacheHandlerParametersSet): Promise<void> {
        const requestInit: RequestInit = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify(args),
        };

        const url = new URL('/set', baseUrl);

        await fetch(url, requestInit);
    }

    public async revalidateTag(...args: CacheHandlerParametersRevalidateTag): Promise<void> {
        const requestInit: RequestInit = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify(args),
        };

        const url = new URL('/revalidateTag', baseUrl);

        await fetch(url, requestInit);
    }
}
