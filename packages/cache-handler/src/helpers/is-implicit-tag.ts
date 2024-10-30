import type { NextCacheImplicitTagId } from '@repo/next-common';

const NEXT_CACHE_IMPLICIT_TAG_ID: NextCacheImplicitTagId = '_N_T_';

/**
 * Checks if a given tag is an implicit tag.
 *
 * @param tag - The tag to check.
 *
 * @returns A boolean indicating whether the tag is an implicit tag.
 */
export function isImplicitTag(tag: string): boolean {
    return tag.startsWith(NEXT_CACHE_IMPLICIT_TAG_ID);
}
