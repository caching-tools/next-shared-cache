/* eslint-disable @typescript-eslint/method-signature-style -- to use a method style */
// eslint-disable-next-line unicorn/prefer-node-protocol -- to overcome tsup's limitations
import type { OutgoingHttpHeaders } from 'http';
import type { CacheHandler } from 'next/dist/server/lib/incremental-cache';
import type IncrementalCache from 'next/dist/server/lib/incremental-cache/file-system-cache';
import type { RouteMetadata as NextRouteMetadata } from 'next/dist/export/routes/types';

export type { CacheHandler, CacheHandlerContext, CacheHandlerValue } from 'next/dist/server/lib/incremental-cache';
export type {
    CachedRedirectValue,
    CachedRouteValue,
    CachedImageValue,
    CachedFetchValue,
    IncrementalCacheValue,
    IncrementalCacheEntry,
} from 'next/dist/server/response-cache/types';

export type RouteMetadata = NextRouteMetadata;

export type NonNullableRouteMetadata = {
    [K in keyof RouteMetadata]: NonNullable<RouteMetadata[K]>;
};

export type FileSystemCacheContext = ConstructorParameters<typeof IncrementalCache>[0];

export type CacheHandlerParametersGet = Parameters<CacheHandler['get']>;

export type CacheHandlerParametersGetWithTags = [...CacheHandlerParametersGet, string[]];

export type CacheHandlerParametersSet = Parameters<CacheHandler['set']>;

export type CacheHandlerParametersRevalidateTag = Parameters<CacheHandler['revalidateTag']>;

export type CacheHandlerReturnTypeGet = ReturnType<CacheHandler['get']>;

export type CacheHandlerReturnTypeSet = ReturnType<CacheHandler['set']>;

export type CacheHandlerReturnTypeRevalidateTag = ReturnType<CacheHandler['revalidateTag']>;

export type UnwrappedCacheHandler = {
    get(...args: CacheHandlerParametersGetWithTags): Awaited<CacheHandlerReturnTypeGet>;
    set(...args: CacheHandlerParametersSet): Awaited<CacheHandlerReturnTypeSet>;
    revalidateTag(...args: CacheHandlerParametersRevalidateTag): Awaited<CacheHandlerReturnTypeRevalidateTag>;
};

export type IncrementalCachedPageValue = {
    kind: 'PAGE';
    html: string;
    pageData: object;
    postponed: string | undefined;
    headers: OutgoingHttpHeaders | undefined;
    status: number | undefined;
};

export type TagsManifest = {
    version: 1;
    items: Record<string, { revalidatedAt: number }>;
};
