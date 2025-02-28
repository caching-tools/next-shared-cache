import type { LRUCache } from 'lru-cache';
import {
  type CacheHandlerValue,
  CachedRouteKind,
} from '../../next-common-types.js';

import type { LruCacheOptions } from '../create-configured-cache.js';
import { createConfiguredCache } from '../create-configured-cache.js';

function calculateObjectSize({ value }: CacheHandlerValue): number {
  // Return default size if value is falsy
  if (!value) {
    return 25;
  }

  switch (value.kind) {
    case CachedRouteKind.REDIRECT: {
      // Calculate size based on the length of the stringified props
      return JSON.stringify(value.props).length;
    }
    case CachedRouteKind.IMAGE: {
      // Throw a specific error for image kind
      throw new Error(
        'Image kind should not be used for incremental-cache calculations.',
      );
    }
    case CachedRouteKind.FETCH: {
      // Calculate size based on the length of the stringified data
      return JSON.stringify(value.data || '').length;
    }
    case CachedRouteKind.APP_ROUTE: {
      // Size based on the length of the body
      return value.body.length;
    }
    case CachedRouteKind.PAGES: {
      return value.html.length + JSON.stringify(value.pageData).length;
    }
    case CachedRouteKind.APP_PAGE: {
      return value.html.length + (value.rscData?.length || 0);
    }
    default: {
      return 0;
    }
  }
}

export type { LruCacheOptions };

export default function createCacheStore(
  options?: LruCacheOptions,
): LRUCache<string, CacheHandlerValue> {
  return createConfiguredCache(calculateObjectSize, options);
}
