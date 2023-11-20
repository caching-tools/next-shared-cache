import { normalizeSlug } from './normalize-slug';
import type { CountBackendApiResponseJson, PageProps } from './types';

export function createGetData(path: string, revalidate?: number, cache?: RequestCache) {
    return async function getData(slug: string): Promise<Omit<PageProps, 'revalidateAfter'> | null> {
        const pathAndTag = `/${path}/${normalizeSlug(slug)}`;

        const url = new URL(`/count${pathAndTag}`, 'http://localhost:8081');

        const result = await fetch(url, {
            cache,
            next: { revalidate, tags: [pathAndTag, 'whole-app-route'] },
        });

        if (!result.ok) {
            return null;
        }

        const parsedResult = (await result.json()) as CountBackendApiResponseJson;

        const newData = { count: parsedResult.count, path, time: parsedResult.unixTimeMs };

        return newData;
    };
}
