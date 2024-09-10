// biome-ignore lint/style/useNodejsImportProtocol: RollupError: "OutgoingHttpHeaders" is not exported by "node:http"
import type { OutgoingHttpHeaders } from 'http';

/**
 * Retrieves the cache tags from the headers.
 *
 * @param headers - Headers object.
 *
 * @returns An array of cache tags.
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
