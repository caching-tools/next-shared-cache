// biome-ignore lint/style/useNodejsImportProtocol: RollupError: "OutgoingHttpHeaders" is not exported by "node:http"
import type { OutgoingHttpHeaders } from 'http';

import type { RouteMetadata as NextRouteMetadata } from 'next/dist/export/routes/types';
import type { CacheHandler, CacheHandlerValue as NextCacheHandlerValue } from 'next/dist/server/lib/incremental-cache';
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
    IncrementalCacheKindHint,
} from 'next/dist/server/response-cache/types';

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

export type RouteMetadata = NextRouteMetadata;

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
