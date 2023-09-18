import type { RequestInit } from 'undici';
import { fetch } from 'undici';
import { stringifyObject } from './logs';

const port = Number.parseInt(process.env.REMOTE_CACHE_HANDLER_PORT ?? '8080', 10);

const debug = (process.env.REMOTE_CACHE_HANDLER_DEBUG ?? 'arguments').split(',');

const host = process.env.REMOTE_CACHE_HANDLER_HOST ?? '[::]';

export class RemoteCacheHandler {
    public async get(pathname: string, fetchCache?: boolean, fetchUrl?: string, fetchIdx?: number): Promise<unknown> {
        if (debug.includes('arguments')) {
            console.log(
                'RemoteCacheHandler.get arguments',
                stringifyObject({
                    pathname,
                    fetchCache,
                    fetchUrl,
                    fetchIdx,
                }),
            );
        }

        const requestInit: RequestInit = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
                pathname,
                ctx: {
                    fetchCache,
                    fetchUrl,
                    fetchIdx,
                },
            }),
        };

        if (debug.includes('requestInit')) {
            console.log('RemoteCacheHandler.get requestInit', stringifyObject(requestInit));
        }

        const url = `http://${host}:${port}/get`;

        if (debug.includes('url')) {
            console.log('RemoteCacheHandler.get url', url);
        }

        const result = await fetch(url, requestInit);

        if (debug.includes('result status')) {
            console.log('RemoteCacheHandler.get result status', result.status, result.statusText);
        }

        if (!result.ok) {
            return null;
        }

        const json: unknown = await result.json();

        if (debug.includes('result json')) {
            console.log('RemoteCacheHandler.get result json', stringifyObject(json));
        }

        return json;
    }

    public async set(
        pathname: string,
        data: unknown,
        fetchCache?: boolean,
        fetchUrl?: string,
        fetchIdx?: number,
    ): Promise<void> {
        if (debug.includes('arguments')) {
            console.log(
                'RemoteCacheHandler.set arguments',
                stringifyObject({
                    pathname,
                    data,
                    fetchCache,
                    fetchUrl,
                    fetchIdx,
                }),
            );
        }

        const requestInit: RequestInit = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
                pathname,
                data,
                ctx: {
                    fetchCache,
                    fetchUrl,
                    fetchIdx,
                },
            }),
        };

        if (debug.includes('requestInit')) {
            console.log('RemoteCacheHandler.set requestInit', stringifyObject(requestInit));
        }

        const url = `http://${host}:${port}/set`;

        if (debug.includes('url')) {
            console.log('RemoteCacheHandler.set url', url);
        }

        const result = await fetch(url, requestInit);

        if (debug.includes('result status')) {
            console.log('RemoteCacheHandler.set result status', result.status, result.statusText);
        }

        if (debug.includes('result json')) {
            console.log('RemoteCacheHandler.set result json', "RemoteCacheHandler.set has no return. It's ok!");
        }
    }

    public async revalidateTag(tag: string): Promise<void> {
        if (debug.includes('arguments')) {
            console.log('RemoteCacheHandler.revalidateTag arguments', stringifyObject({ tag }));
        }

        const requestInit: RequestInit = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({ tag }),
        };

        if (debug.includes('requestInit')) {
            console.log('RemoteCacheHandler.revalidateTag requestInit', stringifyObject(requestInit));
        }

        const url = `http://${host}:${port}/revalidateTag`;

        if (debug.includes('url')) {
            console.log('RemoteCacheHandler.revalidateTag url', url);
        }

        const result = await fetch(url, requestInit);

        if (debug.includes('result status')) {
            console.log('RemoteCacheHandler.revalidateTag result status', result.status, result.statusText);
        }

        if (debug.includes('result json')) {
            console.log(
                'RemoteCacheHandler.revalidateTag result json',
                "RemoteCacheHandler.revalidateTag has no return. It's ok!",
            );
        }
    }
}
