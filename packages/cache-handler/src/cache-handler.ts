import path from 'node:path';
import fs, { promises as fsPromises } from 'node:fs';
import { createCache } from '@neshca/next-lru-cache/next-cache-handler-value';
import type {
    CacheHandler,
    CacheHandlerValue,
    CacheHandlerParametersSet,
    CacheHandlerParametersGet,
    FileSystemCacheContext,
    CachedFetchValue,
    CacheHandlerParametersRevalidateTag,
    RouteMetadata,
    NonNullableRouteMetadata,
} from '@neshca/next-common';
import type { RedisCacheHandlerOptions } from './common-types';

const RSC_PREFETCH_SUFFIX = '.prefetch.rsc';
const RSC_SUFFIX = '.rsc';
const NEXT_DATA_SUFFIX = '.json';
const NEXT_META_SUFFIX = '.meta';

export type TagsManifest = {
    version: 1;
    items: Record<string, { revalidatedAt: number }>;
};
export type { CacheHandlerValue, RedisCacheHandlerOptions as CacheHandlerOptions };

export type Cache = {
    get: (key: string) => Promise<CacheHandlerValue | null | undefined>;
    set: (key: string, value: CacheHandlerValue, ttl?: number) => Promise<void>;
    getTagsManifest: () => Promise<TagsManifest>;
    revalidateTag: (tag: string, revalidatedAt: number) => Promise<void>;
};

type ReadCacheFromDisk = 'yes' | 'no';

type WriteCacheFromDisk = 'yes' | 'no';

type CacheDiskAccessMode = `read-${ReadCacheFromDisk}/write-${WriteCacheFromDisk}`;

type CacheConfigDefaultCache = {
    diskAccessMode?: CacheDiskAccessMode;
    cache?: Cache;
    defaultLruCacheOptions?: never;
};

type CacheConfigWithDefaultCache = {
    diskAccessMode?: CacheDiskAccessMode;
    cache?: never;
    defaultLruCacheOptions?: {
        maxItemsNumber?: number;
        maxItemSizeBytes?: number;
    };
};

export type CacheConfig = CacheConfigDefaultCache | CacheConfigWithDefaultCache;

export type CacheCreationContext = {
    serverDistDir?: string;
    dev?: boolean;
};

export type OnCreationHook = (
    cacheCreationContext: CacheCreationContext,
) => Promise<CacheConfig | undefined> | CacheConfig | undefined;

export class IncrementalCache implements CacheHandler {
    private static initPromise: Promise<void>;

    private static hasPagesDir = false;

    private static diskAccessMode: CacheDiskAccessMode = 'read-yes/write-yes';

    private static cache: Cache;

    private static tagsManifestPath?: string;

    private static serverDistDir?: string;

    private static getConfig: OnCreationHook = () => undefined;

    public static onCreation(onCreationHook: OnCreationHook): void {
        this.getConfig = onCreationHook;
    }

    private static async handleAsyncConfig(configPromise: Promise<CacheConfig | undefined>): Promise<void> {
        try {
            const config = await configPromise;
            this.configure(config);
        } catch (error) {
            throw new Error(`The config promise failed to resolve. ${String(error)}`);
        }
    }

    private static init(cacheCreationContext: CacheCreationContext): void {
        const configOrPromise = this.getConfig(cacheCreationContext);

        if (configOrPromise instanceof Promise) {
            this.initPromise = this.handleAsyncConfig(configOrPromise);

            return;
        }

        this.configure(configOrPromise);

        this.initPromise = Promise.resolve();
    }

    private static configure({
        diskAccessMode = 'read-yes/write-yes',
        cache,
        defaultLruCacheOptions,
    }: CacheConfig = {}): void {
        this.diskAccessMode = diskAccessMode;

        if (this.serverDistDir) {
            this.hasPagesDir = fs.existsSync(path.join(this.serverDistDir, 'pages'));
        }

        if (this.serverDistDir && diskAccessMode === 'read-yes/write-yes') {
            this.tagsManifestPath = path.join(this.serverDistDir, '..', 'cache', 'fetch-cache', 'tags-manifest.json');
        }

        if (cache) {
            this.cache = cache;

            return;
        }

        // if no cache is provided, we use a default LRU cache
        const lruCache = createCache({
            maxItemSizeBytes: defaultLruCacheOptions?.maxItemSizeBytes,
            maxItemsNumber: defaultLruCacheOptions?.maxItemsNumber,
        });

        let tagsManifest: TagsManifest = { items: {}, version: 1 };

        if (this.tagsManifestPath) {
            try {
                const tagsManifestData = fs.readFileSync(this.tagsManifestPath, 'utf-8');

                if (tagsManifestData) {
                    tagsManifest = JSON.parse(tagsManifestData) as TagsManifest;
                }
            } catch (err) {
                // file doesn't exist. Use default tagsManifest
            }
        }

        const defaultCache: Cache = {
            get(key) {
                return Promise.resolve(lruCache.get(key));
            },
            set(key, value) {
                lruCache.set(key, value);
                return Promise.resolve();
            },
            getTagsManifest() {
                return Promise.resolve(tagsManifest);
            },
            revalidateTag(tag, revalidatedAt) {
                tagsManifest.items[tag] = { revalidatedAt };
                return Promise.resolve();
            },
        };

        this.cache = defaultCache;
    }

    private revalidatedTags: FileSystemCacheContext['revalidatedTags'];
    private appDir: FileSystemCacheContext['_appDir'];
    private pagesDir: FileSystemCacheContext['_pagesDir'] | undefined;
    private serverDistDir: FileSystemCacheContext['serverDistDir'];
    private readonly experimental: FileSystemCacheContext['experimental'];

    public constructor(context: FileSystemCacheContext) {
        this.revalidatedTags = context.revalidatedTags;
        this.appDir = Boolean(context._appDir);
        this.pagesDir = context._pagesDir;
        this.serverDistDir = context.serverDistDir;
        this.experimental = context.experimental;

        if (!IncrementalCache.cache) {
            IncrementalCache.serverDistDir = this.serverDistDir;
            IncrementalCache.init({ dev: context.dev, serverDistDir: this.serverDistDir });
        }
    }

    public async get(...args: CacheHandlerParametersGet): Promise<CacheHandlerValue | null> {
        const [cacheKey, ctx = {}] = args;

        const { tags = [], softTags = [], kindHint } = ctx;

        await IncrementalCache.initPromise;

        let cachedData: CacheHandlerValue | null = (await IncrementalCache.cache.get(cacheKey)) ?? null;

        if (!cachedData && IncrementalCache.diskAccessMode.includes('read-yes')) {
            try {
                const bodyFilePath = this.getFilePath(`${cacheKey}.body`, 'app');

                const bodyFileData = await fsPromises.readFile(bodyFilePath);
                const { mtime } = await fsPromises.stat(bodyFilePath);

                const metaFileData = await fsPromises.readFile(
                    bodyFilePath.replace(/\.body$/, NEXT_META_SUFFIX),
                    'utf-8',
                );
                const meta: NonNullableRouteMetadata = JSON.parse(metaFileData) as NonNullableRouteMetadata;

                const cacheEntry: CacheHandlerValue = {
                    lastModified: mtime.getTime(),
                    value: {
                        kind: 'ROUTE',
                        body: bodyFileData,
                        headers: meta.headers,
                        status: meta.status,
                    },
                };

                return cacheEntry;
            } catch (_) {
                // no .meta data for the related key
            }

            try {
                // Determine the file kind if we didn't know it already.
                let kind = kindHint;

                if (!kind) {
                    kind = this.detectFileKind(`${cacheKey}.html`);
                }

                const isAppPath = kind === 'app';
                const pageFilePath = this.getFilePath(kind === 'fetch' ? cacheKey : `${cacheKey}.html`, kind);

                const pageFile = await fsPromises.readFile(pageFilePath, 'utf-8');
                const { mtime } = await fsPromises.stat(pageFilePath);

                if (kind === 'fetch') {
                    const lastModified = mtime.getTime();
                    const parsedData = JSON.parse(pageFile) as CachedFetchValue;

                    cachedData = {
                        lastModified,
                        value: parsedData,
                    };

                    if (cachedData.value?.kind === 'FETCH') {
                        const storedTags = cachedData.value.tags;

                        // update stored tags if a new one is being added
                        // TODO: remove this when we can send the tags
                        // via header on GET same as SET
                        if (!tags?.every((tag) => storedTags?.includes(tag))) {
                            await this.set(cacheKey, cachedData.value, { tags });
                        }
                    }
                } else {
                    const pageDataFilePath = isAppPath
                        ? this.getFilePath(
                              `${cacheKey}${this.experimental.ppr ? RSC_PREFETCH_SUFFIX : RSC_SUFFIX}`,
                              'app',
                          )
                        : this.getFilePath(`${cacheKey}${NEXT_DATA_SUFFIX}`, 'pages');

                    const pageDataFile = await fsPromises.readFile(pageDataFilePath, 'utf-8');

                    const pageData = isAppPath ? pageDataFile : (JSON.parse(pageDataFile) as object);

                    let meta: RouteMetadata | undefined;

                    if (isAppPath) {
                        try {
                            const metaFileData = await fsPromises.readFile(
                                pageFilePath.replace(/\.html$/, NEXT_META_SUFFIX),
                                'utf-8',
                            );
                            meta = JSON.parse(metaFileData) as RouteMetadata;
                        } catch {
                            // no .meta data for the related key
                        }
                    }

                    cachedData = {
                        lastModified: mtime.getTime(),
                        value: {
                            kind: 'PAGE',
                            html: pageFile,
                            pageData,
                            postponed: meta?.postponed,
                            headers: meta?.headers,
                            status: meta?.status,
                        },
                    };
                }

                if (cachedData) {
                    await IncrementalCache.cache.set(cacheKey, cachedData);
                }
            } catch (_) {
                // unable to get data from disk
            }
        }

        if (!cachedData) {
            return null;
        }

        // credits to Next.js for the following code
        if (cachedData.value?.kind === 'PAGE') {
            let cacheTags: undefined | string[];
            const tagsHeader = cachedData.value.headers?.['x-next-cache-tags'];

            if (typeof tagsHeader === 'string') {
                cacheTags = tagsHeader.split(',');
            }

            const tagsManifest = await IncrementalCache.cache.getTagsManifest();

            if (cacheTags?.length) {
                const isStale = cacheTags.some((tag) => {
                    const revalidatedAt = tagsManifest.items[tag]?.revalidatedAt;

                    return revalidatedAt && revalidatedAt >= (cachedData?.lastModified || Date.now());
                });

                // we trigger a blocking validation if an ISR page
                // had a tag revalidated, if we want to be a background
                // revalidation instead we return cachedData.lastModified = -1
                if (isStale) {
                    return null;
                }
            }
        }

        if (cachedData.value?.kind === 'FETCH') {
            const combinedTags = [...tags, ...softTags];

            const tagsManifest = await IncrementalCache.cache.getTagsManifest();

            const wasRevalidated = combinedTags.some((tag: string) => {
                if (this.revalidatedTags.includes(tag)) {
                    return true;
                }

                const revalidatedAt = tagsManifest.items[tag]?.revalidatedAt;

                return revalidatedAt && revalidatedAt >= (cachedData?.lastModified || Date.now());
            });
            // When revalidate tag is called we don't return
            // stale cachedData so it's updated right away
            if (wasRevalidated) {
                return null;
            }
        }

        return cachedData;
    }

    public async set(...args: CacheHandlerParametersSet): Promise<void> {
        const [cacheKey, data, ctx] = args;

        let ttl: number | undefined;

        const { revalidate } = ctx;

        if (IncrementalCache.diskAccessMode === 'read-no/write-no' && typeof revalidate === 'number') {
            ttl = revalidate;
        }

        await IncrementalCache.initPromise;

        await IncrementalCache.cache.set(
            cacheKey,
            {
                value: data,
                lastModified: Date.now(),
            },
            ttl,
        );

        if (!data || IncrementalCache.diskAccessMode.includes('write-no')) {
            return;
        }

        // credits to Next.js for the following code
        if (data.kind === 'ROUTE') {
            const filePath = this.getFilePath(`${cacheKey}.body`, 'app');

            const meta: RouteMetadata = {
                headers: data.headers,
                status: data.status,
                postponed: undefined,
            };

            await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
            await fsPromises.writeFile(filePath, data.body);
            await fsPromises.writeFile(filePath.replace(/\.body$/, NEXT_META_SUFFIX), JSON.stringify(meta, null, 2));

            return;
        }

        if (data.kind === 'PAGE') {
            const isAppPath = typeof data.pageData === 'string';
            const htmlPath = this.getFilePath(`${cacheKey}.html`, isAppPath ? 'app' : 'pages');
            await fsPromises.mkdir(path.dirname(htmlPath), { recursive: true });
            await fsPromises.writeFile(htmlPath, data.html);

            await fsPromises.writeFile(
                this.getFilePath(
                    `${cacheKey}${isAppPath ? RSC_SUFFIX : NEXT_DATA_SUFFIX}`,
                    isAppPath ? 'app' : 'pages',
                ),
                isAppPath ? JSON.stringify(data.pageData) : JSON.stringify(data.pageData),
            );

            if (data.headers || data.status) {
                const meta: RouteMetadata = {
                    headers: data.headers,
                    status: data.status,
                    postponed: data.postponed,
                };

                await fsPromises.writeFile(htmlPath.replace(/\.html$/, NEXT_META_SUFFIX), JSON.stringify(meta));
            }
            return;
        }

        if (data.kind === 'FETCH') {
            const filePath = this.getFilePath(cacheKey, 'fetch');

            await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
            await fsPromises.writeFile(
                filePath,
                JSON.stringify({
                    ...data,
                    tags: ctx.tags,
                }),
            );
        }
    }

    public async revalidateTag(...args: CacheHandlerParametersRevalidateTag): Promise<void> {
        const [tag] = args;

        await IncrementalCache.initPromise;

        await IncrementalCache.cache.revalidateTag(tag, Date.now());

        if (!IncrementalCache.tagsManifestPath || IncrementalCache.diskAccessMode.includes('write-no')) {
            return;
        }

        const tagsManifest = await IncrementalCache.cache.getTagsManifest();

        try {
            await fsPromises.mkdir(path.dirname(IncrementalCache.tagsManifestPath), { recursive: true });
            await fsPromises.writeFile(IncrementalCache.tagsManifestPath, JSON.stringify(tagsManifest || {}));
        } catch (err) {
            // eslint-disable-next-line no-console -- we want to log this
            console.warn('Failed to update tags manifest.', err);
        }
    }

    // credits to Next.js for the following code
    private detectFileKind(pathname: string): 'app' | 'pages' {
        const pagesDir = this.pagesDir ?? IncrementalCache.hasPagesDir;

        if (!this.appDir && !pagesDir) {
            throw new Error("Invariant: Can't determine file path kind, no page directory enabled");
        }

        // If app directory isn't enabled, then assume it's pages and avoid the fs
        // hit.
        if (!this.appDir && pagesDir) {
            return 'pages';
        }
        // Otherwise assume it's a pages file if the pages directory isn't enabled.
        else if (this.appDir && !pagesDir) {
            return 'app';
        }

        // If both are enabled, we need to test each in order, starting with
        // `pages`.
        let filePath = this.getFilePath(pathname, 'pages');
        if (fs.existsSync(filePath)) {
            return 'pages';
        }

        filePath = this.getFilePath(pathname, 'app');
        if (fs.existsSync(filePath)) {
            return 'app';
        }

        throw new Error(`Invariant: Unable to determine file path kind for ${pathname}`);
    }

    // credits to Next.js for the following code
    private getFilePath(pathname: string, kind: 'app' | 'fetch' | 'pages'): string {
        switch (kind) {
            case 'fetch':
                // we store in .next/cache/fetch-cache so it can be persisted
                // across deploys
                return path.join(this.serverDistDir, '..', 'cache', 'fetch-cache', pathname);
            case 'pages':
                return path.join(this.serverDistDir, 'pages', pathname);
            case 'app':
                return path.join(this.serverDistDir, 'app', pathname);
            default:
                throw new Error("Invariant: Can't determine file path kind");
        }
    }
}
