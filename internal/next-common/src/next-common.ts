// biome-ignore lint/style/useNodejsImportProtocol: RollupError: "OutgoingHttpHeaders" is not exported by "node:http"
import type { OutgoingHttpHeaders } from 'http';
import type { CacheHandler, CacheHandlerValue as NextCacheHandlerValue } from 'next/dist/server/lib/incremental-cache';
import type FileSystemCache from 'next/dist/server/lib/incremental-cache/file-system-cache';
import type {
    CachedImageValue,
    CachedRedirectValue,
    CachedRouteKind,
    CachedRouteValue,
    IncrementalCacheValue as IncrementalCacheValueNextApi,
    IncrementalCachedAppPageValue,
    CachedFetchValue as NextCachedFetchValue,
} from 'next/dist/server/response-cache/types';

export type { PrerenderManifest } from 'next/dist/build';
export type { CacheHandler, CacheHandlerContext } from 'next/dist/server/lib/incremental-cache';

type Override<T, U> = Omit<T, keyof U> & U;

type ExtractIncrementalCacheKind<T, Kind> = T extends { kind: Kind } ? T : never;

export type Revalidate = false | number;

export type IncrementalCachedPageValue = ExtractIncrementalCacheKind<
    IncrementalCacheValueNextApi,
    CachedRouteKind.PAGES
>;

export type LegacyIncrementalCachedPageValue = Override<IncrementalCachedPageValue, { kind: 'PAGE' }> & {
    postponed: string | undefined;
};

export type CachedFetchValue = Override<NextCachedFetchValue, { kind: 'FETCH' }>;

export type IncrementalCacheValue =
    | Override<CachedRedirectValue, { kind: 'REDIRECT' }>
    | LegacyIncrementalCachedPageValue
    | Override<IncrementalCachedPageValue, { kind: 'PAGES' }>
    | Override<IncrementalCachedAppPageValue, { kind: 'APP_PAGE' }>
    | Override<CachedImageValue, { kind: 'IMAGE' }>
    | CachedFetchValue
    | Override<CachedRouteValue, { kind: 'ROUTE' | 'APP_ROUTE' }>;

export type IncrementalCacheEntry = {
    curRevalidate?: Revalidate;
    revalidateAfter: Revalidate;
    isStale?: boolean | -1;
    value: IncrementalCacheValue | null;
    isFallback: boolean | undefined;
};

export type NextRouteMetadata = {
    status: number | undefined;
    headers: OutgoingHttpHeaders | undefined;
    postponed: string | undefined;
};

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

export type CacheHandlerValue = Override<
    NextCacheHandlerValue & {
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
    },
    {
        value: IncrementalCacheValue | null;
    }
>;

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

export type TagsManifest = {
    version: 1;
    items: Record<string, { revalidatedAt: number }>;
};

export type NextCacheImplicitTagId = '_N_T_';
