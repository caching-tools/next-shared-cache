/* eslint-disable @typescript-eslint/method-signature-style -- need to use a method style */
import type { OutgoingHttpHeaders } from 'node:http';
import type { CacheHandler } from 'next/dist/server/lib/incremental-cache';

export type { CacheHandler, CacheHandlerContext, CacheHandlerValue } from 'next/dist/server/lib/incremental-cache';
export type {
    CachedRedirectValue,
    CachedRouteValue,
    CachedImageValue,
    CachedFetchValue,
    IncrementalCacheValue,
    IncrementalCacheEntry,
} from 'next/dist/server/response-cache/types';

export type CacheHandlerParametersGet = Parameters<CacheHandler['get']>;

export type CacheHandlerParametersSet = Parameters<CacheHandler['set']>;

export type CacheHandlerParametersRevalidateTag = Parameters<CacheHandler['revalidateTag']>;

export type CacheHandlerReturnTypeGet = ReturnType<CacheHandler['get']>;

export type CacheHandlerReturnTypeSet = ReturnType<CacheHandler['set']>;

export type CacheHandlerReturnTypeRevalidateTag = ReturnType<CacheHandler['revalidateTag']>;

export type UnwrappedCacheHandler = {
    get(...args: CacheHandlerParametersGet): Awaited<CacheHandlerReturnTypeGet>;
    set(...args: CacheHandlerParametersSet): Awaited<CacheHandlerReturnTypeSet>;
    revalidateTag(...args: CacheHandlerParametersRevalidateTag): Awaited<CacheHandlerReturnTypeRevalidateTag>;
};

export type IncrementalCachedPageValue = {
    kind: 'PAGE';
    html: string;
    pageData: object;
    headers?: OutgoingHttpHeaders;
    status?: number;
};

export type TagsManifest = {
    version: 1;
    items: Record<string, { revalidatedAt: number }>;
};

export const NEXT_CACHE_TAGS_HEADER = 'x-next-cache-tags';
