import type { OutgoingHttpHeaders } from 'node:http';
import type {
    CacheHandler,
    CacheHandlerValue as NextCacheHandlerValue,
} from 'next/dist/server/lib/incremental-cache';
import type FileSystemCache from 'next/dist/server/lib/incremental-cache/file-system-cache';
import type { Revalidate } from 'next/dist/server/lib/revalidate';

export type { PrerenderManifest } from 'next/dist/build';
export type { Revalidate } from 'next/dist/server/lib/revalidate';
export type { CacheHandler, CacheHandlerContext } from 'next/dist/server/lib/incremental-cache';
export type {
    CachedRedirectValue,
    CachedRouteValue,
    CachedImageValue,
    CachedFetchValue,
    IncrementalCacheValue,
    IncrementalCacheEntry,
    IncrementalCachedPageValue,
    IncrementalCachedAppPageValue,
    IncrementalCacheKind as Kek,
    CachedRouteKind as Lol,
} from 'next/dist/server/response-cache/types';

export const CachedRouteKind = {
    APP_PAGE: 'APP_PAGE',
    APP_ROUTE: 'APP_ROUTE',
    PAGES: 'PAGES',
    FETCH: 'FETCH',
    REDIRECT: 'REDIRECT',
    IMAGE: 'IMAGE',
} as const;

export const IncrementalCacheKind = {
    APP_PAGE: 'APP_PAGE',
    APP_ROUTE: 'APP_ROUTE',
    PAGES: 'PAGES',
    FETCH: 'FETCH',
    IMAGE: 'IMAGE',
} as const;

/**
 * A set of time periods and timestamps for controlling cache behavior.
 */
export type LifespanParameters = {
    /**
     * The Unix timestamp (in seconds) for when the cache entry was last modified.
     */
    readonly lastModifiedAt: number;
    /**
     * The Unix timestamp (in seconds) for when the cache entry entry becomes stale.
     * After this time, the entry is considered staled and may be used.
     */
    readonly staleAt: number;
    /**
     * The Unix timestamp (in seconds) for when the cache entry must be removed from the cache.
     * After this time, the entry is considered expired and should not be used.
     */
    readonly expireAt: number;
    /**
     * Time in seconds before the cache entry becomes stale.
     */
    readonly staleAge: number;
    /**
     * Time in seconds before the cache entry becomes expired.
     */
    readonly expireAge: number;
    /**
     * Value from Next.js revalidate option. May be false if the page has no revalidate option or the revalidate option is set to false.
     */
    readonly revalidate: Revalidate | undefined;
};

export type CacheHandlerValue = NextCacheHandlerValue & {
    /**
     * Timestamp in milliseconds when the cache entry was last modified.
     */
    lastModified: number;
    /**
     * Tags associated with the cache entry. They are used for on-demand revalidation.
     */
    tags: Readonly<string[]>;
    /**
     * The lifespan parameters for the cache entry.
     *
     * Null for pages with `fallback: false` in `getStaticPaths`.
     * Consider these pages as always fresh and never stale.
     */
    lifespan: LifespanParameters | null;
};

export type RouteMetadata = {
    status: number | undefined;
    headers: OutgoingHttpHeaders | undefined;
    postponed: string | undefined;
};

export type NonNullableRouteMetadata = {
    [K in keyof RouteMetadata]: NonNullable<RouteMetadata[K]>;
};

export type FileSystemCacheContext = ConstructorParameters<typeof FileSystemCache>[0];

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

export type TagsManifest = {
    version: 1;
    items: Record<string, { revalidatedAt: number }>;
};

export const NEXT_CACHE_IMPLICIT_TAG_ID = '_N_T_';
