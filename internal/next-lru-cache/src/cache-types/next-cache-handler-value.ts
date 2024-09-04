import { type CacheHandlerValue, CachedRouteKind, type Lol } from '@neshca/next-common';
import type { LRUCache } from 'lru-cache';

import type { LruCacheOptions } from '../create-configured-cache';
import { createConfiguredCache } from '../create-configured-cache';

function calculateObjectSize({ value }: CacheHandlerValue): number {
    // Return default size if value is falsy
    if (!value) {
        return 25;
    }

    switch (value.kind) {
        case CachedRouteKind.REDIRECT as unknown as Lol.REDIRECT: {
            // Calculate size based on the length of the stringified props
            return JSON.stringify(value.props).length;
        }
        case CachedRouteKind.IMAGE as unknown as Lol.IMAGE: {
            // Throw a specific error for image kind
            throw new Error('Image kind should not be used for incremental-cache calculations.');
        }
        case CachedRouteKind.FETCH as unknown as Lol.FETCH: {
            // Calculate size based on the length of the stringified data
            return JSON.stringify(value.data || '').length;
        }
        case CachedRouteKind.APP_ROUTE as unknown as Lol.APP_ROUTE: {
            // Size based on the length of the body
            return value.body.length;
        }
        case CachedRouteKind.APP_PAGE as unknown as Lol.APP_PAGE: {
            return value.html.length + (JSON.stringify(value.rscData)?.length ?? 0);
        }
        case CachedRouteKind.PAGES as unknown as Lol.PAGES: {
            return value.html.length + (JSON.stringify(value.pageData)?.length ?? 0);
        }
        default: {
            throw new Error('Unknown cache handler value kind');
        }
    }
}

export type { LruCacheOptions };

export default function createCacheStore(options?: LruCacheOptions): LRUCache<string, CacheHandlerValue> {
    return createConfiguredCache(calculateObjectSize, options);
}
