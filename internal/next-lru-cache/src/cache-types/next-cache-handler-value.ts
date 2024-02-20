import type { CacheHandlerValue } from '@neshca/next-common';
import type { LRUCache } from 'lru-cache';

import type { LruCacheOptions } from '../create-configured-cache';
import { createConfiguredCache } from '../create-configured-cache';

function calculateObjectSize({ value }: CacheHandlerValue): number {
    // Return default size if value is falsy
    if (!value) {
        return 25;
    }

    switch (value.kind) {
        case 'REDIRECT': {
            // Calculate size based on the length of the stringified props
            return JSON.stringify(value.props).length;
        }
        case 'IMAGE': {
            // Throw a specific error for image kind
            throw new Error('Image kind should not be used for incremental-cache calculations.');
        }
        case 'FETCH': {
            // Calculate size based on the length of the stringified data
            return JSON.stringify(value.data || '').length;
        }
        case 'ROUTE': {
            // Size based on the length of the body
            return value.body.length;
        }
        default: {
            // Rough estimate calculation for other types
            // Combine HTML length and page data length
            const pageDataLength = value.pageData ? JSON.stringify(value.pageData).length : 0;
            return value.html.length + pageDataLength;
        }
    }
}

export type { LruCacheOptions };

export function createCache(options?: LruCacheOptions): LRUCache<string, CacheHandlerValue> {
    return createConfiguredCache(calculateObjectSize, options);
}
