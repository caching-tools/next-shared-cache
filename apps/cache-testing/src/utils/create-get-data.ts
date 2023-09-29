import { normalizeSlug } from './normalize-slug';
import type { PageProps } from './types';

export function createGetData(path: string, revalidate?: number) {
    return async function getData(slug: string): Promise<Omit<PageProps, 'revalidateAfter'> | null> {
        const pathAndTag = `/${path}/${normalizeSlug(slug)}`;

        const result = await fetch(`http://localhost:8081${pathAndTag}`, {
            next: { revalidate, tags: [pathAndTag, 'whole-app-route'] },
        });

        if (!result.ok) {
            return null;
        }

        const parsedResult = (await result.json()) as { count: number } | null;

        if (!parsedResult) {
            return null;
        }

        const time = Date.now();

        return { count: parsedResult.count, path, time };
    };
}
