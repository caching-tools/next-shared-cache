import { neshCache } from '@neshca/cache-handler/functions';
import axios from 'axios';
import { unstable_cache } from 'next/cache';
import { normalizeSlug } from './normalize-slug';
import type { CountBackendApiResponseJson, PageProps } from './types';

async function getViaAxios(url: URL) {
    try {
        return (await axios.get<CountBackendApiResponseJson>(url.href)).data;
    } catch (_error) {
        return null;
    }
}

const cachedAxios = neshCache(getViaAxios);

export function createGetData(
    path: string,
    revalidate?: number,
    cache?: RequestCache | 'unstable-cache' | 'nesh-cache',
) {
    return async function getData(slug: string): Promise<Omit<PageProps, 'revalidateAfter'> | null> {
        const pathAndTag = `/${path}/${normalizeSlug(slug)}`;

        const url = new URL(`/count${pathAndTag}`, 'http://localhost:8081');

        let parsedResult: CountBackendApiResponseJson;

        const tags = [pathAndTag, 'whole-app-route'];

        switch (cache) {
            case 'unstable-cache': {
                const cachedGet = unstable_cache(getViaAxios, tags, {
                    revalidate,
                    tags,
                });

                const data = await cachedGet(url);

                if (!data) {
                    return null;
                }

                parsedResult = data;

                break;
            }
            case 'nesh-cache': {
                const data = await cachedAxios(
                    {
                        revalidate,
                        tags,
                    },
                    url,
                );

                if (!data) {
                    return null;
                }

                parsedResult = data;

                break;
            }

            default: {
                const result = await fetch(url, {
                    cache,
                    next: { revalidate, tags },
                });

                if (!result.ok) {
                    return null;
                }

                parsedResult = (await result.json()) as CountBackendApiResponseJson;

                break;
            }
        }

        const newData = { count: parsedResult.count, path, time: parsedResult.unixTimeMs };

        return newData;
    };
}
