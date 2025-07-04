import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from 'next/cache';
import { normalizeSlug } from './normalize-slug';
import type { CountBackendApiResponseJson, PageProps } from './types';

export function createGetData(path: string, revalidate?: number) {
  return async function getData(
    slug: string,
  ): Promise<Omit<PageProps, 'revalidateAfter'> | null> {
    'use cache';

    const pathAndTag = `/${path}/${normalizeSlug(slug)}`;

    cacheLife({
      revalidate,
    });

    cacheTag(pathAndTag, 'whole-app-route');

    const url = new URL(`/count${pathAndTag}`, 'http://localhost:8081');

    const result = await fetch(url);

    if (!result.ok) {
      return null;
    }

    const parsedResult = (await result.json()) as CountBackendApiResponseJson;

    const newData = {
      count: parsedResult.count,
      path,
      time: parsedResult.unixTimeMs,
    };

    return newData;
  };
}
