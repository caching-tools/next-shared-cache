import type { IncrementalCachedPageValue } from '@neshca/next-common';

export const NEXT_CACHE_IMPLICIT_TAG_ID = '_N_T_';

/**
 * Checks if a tag is an internal tag.
 * Internal tags start with '\_N_T\_'.
 *
 * @param tag - The tag to check.
 *
 * @returns True if the tag is an internal tag, false otherwise.
 */
function filterInternalTag(tag: string): boolean {
    return !tag.startsWith(NEXT_CACHE_IMPLICIT_TAG_ID);
}

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

    return pageTags.filter(filterInternalTag);
}
