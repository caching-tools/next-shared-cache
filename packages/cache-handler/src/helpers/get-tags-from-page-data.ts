import type { IncrementalCachedPageValue } from '@neshca/next-common';

/**
 * Retrieves the cache tags from the given page data.
 *
 * @param data - The incremental cached page value.
 *
 * @returns An array of cache tags without the internal Next.js tags.
 */
export function getTagsFromPageData(data: IncrementalCachedPageValue): string[] {
    const headers = data.headers?.['x-next-cache-tags'];
    const pageTags = typeof headers === 'string' ? headers.split(',') : [];

    return pageTags;
}
