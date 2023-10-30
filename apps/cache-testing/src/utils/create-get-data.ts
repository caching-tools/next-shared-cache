import { normalizeSlug } from './normalize-slug';
import type { PageProps } from './types';

const cache = new Map<string, Omit<PageProps, 'revalidateAfter'>>();

export function createGetData(path: string, revalidate?: number) {
    return async function getData(slug: string): Promise<Omit<PageProps, 'revalidateAfter'> | null> {
        const pathAndTag = `/${path}/${normalizeSlug(slug)}`;

        const url = new URL(`/count${pathAndTag}`, 'http://localhost:8081');

        const result = await fetch(url, {
            next: { revalidate, tags: [pathAndTag, 'whole-app-route'] },
        });

        if (!result.ok) {
            return null;
        }

        const parsedResult = (await result.json()) as { count: number } | null;

        if (!parsedResult) {
            return null;
        }

        const cacheKey = `${parsedResult.count} ${pathAndTag}`;

        const data = cache.get(cacheKey);

        if (data) {
            return data;
        }

        const time = Date.now();

        const newData = { count: parsedResult.count, path, time };

        cache.set(cacheKey, newData);

        return newData;
    };
}
