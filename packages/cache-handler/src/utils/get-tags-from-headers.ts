import type { OutgoingHttpHeaders } from 'node:http';

/**
 * Extracts cache tags from the 'x-next-cache-tags' HTTP header.
 *
 * This function parses cache invalidation tags from response headers, which are used
 * by Next.js to manage cache revalidation. It handles both string and array header formats.
 *
 * @param headers - The HTTP headers object containing potential cache tags
 *
 * @returns An array of extracted cache tag strings, or an empty array if no tags are found
 *
 * @example
 * // With string header
 * getTagsFromHeaders({ 'x-next-cache-tags': 'tag1,tag2,tag3' })
 * // Returns: ['tag1', 'tag2', 'tag3']
 *
 * @example
 * // With array header
 * getTagsFromHeaders({ 'x-next-cache-tags': ['tag1', 'tag2'] })
 * // Returns: ['tag1', 'tag2']
 */
export function getTagsFromHeaders(headers: OutgoingHttpHeaders): string[] {
  const tagsHeader = headers['x-next-cache-tags'];

  if (Array.isArray(tagsHeader)) {
    return tagsHeader;
  }

  if (typeof tagsHeader === 'string') {
    return tagsHeader.split(',');
  }

  return [];
}
