export type CacheMethod = 'get' | 'set' | 'revalidateTag';

export type CachedRedirectValue = {
    kind: 'REDIRECT';
    props: object;
};

export type CachedRouteValue = {
    kind: 'ROUTE';
    // this needs to be a RenderResult so since renderResponse
    // expects that type instead of a string
    body: { type: 'Buffer'; data: number[] };
    status: number;
    headers: Record<string, string>;
};

export type CachedImageValue = {
    kind: 'IMAGE';
    etag: string;
    buffer: { type: 'Buffer'; data: number[] };
    extension: string;
    isMiss?: boolean;
    isStale?: boolean;
};

export type CachedFetchValue = {
    kind: 'FETCH';
    data: {
        headers: Record<string, string>;
        body: string;
        url: string;
        status?: number;
        tags?: string[];
    };
    revalidate: number;
};

export type IncrementalCachedPageValue = {
    kind: 'PAGE';
    // this needs to be a string since the cache expects to store
    // the string value
    html: string;
    pageData: object;
    headers?: Record<string, string>;
    status?: number;
};

export type IncrementalCacheValue =
    | CachedRedirectValue
    | IncrementalCachedPageValue
    | CachedImageValue
    | CachedFetchValue
    | CachedRouteValue;

export type CacheContext = {
    fetchCache?: boolean;
    revalidate?: number | false;
    fetchUrl?: string;
    fetchIdx?: number;
    tags?: string[];
    softTags?: string[];
};

export type CacheGetOptions = {
    cacheKey: string;
    ctx: CacheContext;
};

export type CacheSetOptions = {
    cacheKey: string;
    data: IncrementalCacheValue | null;
    ctx: CacheContext;
};

export type CacheRevalidateTagOptions = {
    tag: string;
};

export type CacheHandlerValue = {
    lastModified: number;
    value: IncrementalCacheValue | null;
    ctx: CacheSetOptions['ctx'];
};

export type IncrementalCacheEntry = {
    curRevalidate?: number | false;
    // milliseconds to revalidate after
    revalidateAfter: number | false;
    // -1 here dictates a blocking revalidate should be used
    isStale?: boolean | -1;
    value: IncrementalCacheValue | null;
};

export type Options = CacheGetOptions | CacheSetOptions | CacheRevalidateTagOptions;

export type TagsManifest = {
    version: 1;
    items: Record<string, { keys: string[]; revalidatedAt: number }>;
};
