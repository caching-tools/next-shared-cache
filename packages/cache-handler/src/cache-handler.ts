import path from 'node:path';
import fsPromises from 'node:fs/promises';
import fs from 'node:fs';
import type { OutgoingHttpHeaders } from 'node:http';
import type {
    CacheHandler,
    CacheHandlerValue,
    CacheHandlerParametersSet,
    CacheHandlerParametersGet,
    TagsManifest,
    FileSystemCacheContext,
    CachedFetchValue,
    CacheHandlerParametersRevalidateTag,
} from '@neshca/next-types';
import { LRUCache } from 'lru-cache';

export type { TagsManifest } from '@neshca/next-types';

type Meta = { status: number; headers: OutgoingHttpHeaders };

export type Cache<T = CacheHandlerValue> = {
    get: (key: string) => Promise<CacheHandlerValue | null | undefined>;
    set: (key: string, value: T, ttl?: number) => Promise<void>;
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
        max?: number;
        maxSize?: number;
    };
};

export type CacheConfig = CacheConfigDefaultCache | CacheConfigWithDefaultCache;

export type CacheCreationContext = {
    serverDistDir?: string;
    dev?: boolean;
};

export class IncrementalCache implements CacheHandler {
    private static diskAccessMode: CacheDiskAccessMode = 'read-yes/write-yes';

    private static cache: Cache;

    private static tagsManifestPath?: string;

    private static serverDistDir?: string;

    private static configDefiner: (cacheCreationContext: CacheCreationContext) => CacheConfig | undefined = () =>
        undefined;

    public static onCreation(
        onCreationCallback: (cacheCreationContext: CacheCreationContext) => CacheConfig | undefined,
    ): void {
        this.configDefiner = onCreationCallback;
    }

    private static init(cacheCreationContext: CacheCreationContext): void {
        this.configure(this.configDefiner(cacheCreationContext));
    }

    private static configure({
        diskAccessMode = 'read-yes/write-yes',
        cache,
        defaultLruCacheOptions,
    }: CacheConfig = {}): void {
        this.diskAccessMode = diskAccessMode;

        if (this.serverDistDir && diskAccessMode === 'read-yes/write-yes') {
            this.tagsManifestPath = path.join(this.serverDistDir, '..', 'cache', 'fetch-cache', 'tags-manifest.json');
        }

        if (cache) {
            this.cache = cache;

            return;
        }

        // if no cache is provided, we use a default LRU cache

        const lruCache = new LRUCache<string, CacheHandlerValue>({
            max: defaultLruCacheOptions?.max ?? 1000,
            maxSize: defaultLruCacheOptions?.maxSize ?? 1024 * 1024 * 500, // 500MB
            // Credits to Next.js for the following code
            sizeCalculation: ({ value }) => {
                if (!value) {
                    return 25;
                } else if (value.kind === 'REDIRECT') {
                    return JSON.stringify(value.props).length;
                } else if (value.kind === 'IMAGE') {
                    throw new Error('invariant image should not be incremental-cache');
                } else if (value.kind === 'FETCH') {
                    return JSON.stringify(value.data || '').length;
                } else if (value.kind === 'ROUTE') {
                    return value.body.length;
                }
                // rough estimate of size of cache value
                return value.html.length + (JSON.stringify(value.pageData)?.length || 0);
            },
        });

        let tagsManifest: TagsManifest = { items: {}, version: 1 };

        if (this.tagsManifestPath) {
            try {
                const tagsManifestData = fs.readFileSync(this.tagsManifestPath).toString('utf8');

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

    revalidatedTags: FileSystemCacheContext['revalidatedTags'];
    appDir: FileSystemCacheContext['_appDir'];
    serverDistDir: FileSystemCacheContext['serverDistDir'];

    public constructor(context: FileSystemCacheContext) {
        this.revalidatedTags = context.revalidatedTags;
        this.appDir = context._appDir;
        this.serverDistDir = context.serverDistDir;

        if (!context.dev && !IncrementalCache.cache) {
            IncrementalCache.serverDistDir = this.serverDistDir;
            IncrementalCache.init({ dev: context.dev, serverDistDir: this.serverDistDir });
        }
    }

    public async get(...args: CacheHandlerParametersGet): Promise<CacheHandlerValue | null> {
        const [cacheKey, ctx = {}] = args;

        const { tags = [], softTags = [], fetchCache } = ctx;

        let cachedData: CacheHandlerValue | null = null;

        try {
            cachedData = (await IncrementalCache.cache.get(cacheKey)) ?? null;
        } catch (error) {
            return null;
        }

        if (!cachedData && IncrementalCache.diskAccessMode.includes('read-yes')) {
            try {
                const { filePath } = await this.getFsPath({
                    pathname: `${cacheKey}.body`,
                    appDir: true,
                });

                const fileData = await fsPromises.readFile(filePath);
                const { mtime } = await fsPromises.stat(filePath);

                const metaFilePath = filePath.replace(/\.body$/, '.meta');
                const metaFileData = await fsPromises.readFile(metaFilePath);
                const meta: Meta = JSON.parse(metaFileData.toString('utf8')) as Meta;

                const cacheEntry: CacheHandlerValue = {
                    lastModified: mtime.getTime(),
                    value: {
                        kind: 'ROUTE',
                        body: fileData,
                        headers: meta.headers,
                        status: meta.status,
                    },
                };
                return cacheEntry;
            } catch (_) {
                // no .meta data for the related key
            }

            try {
                const { filePath: htmlFilePath, isAppPath: isHtmlFileInAppPath } = await this.getFsPath({
                    pathname: fetchCache ? cacheKey : `${cacheKey}.html`,
                    fetchCache,
                });
                const htmlFileData = (await fsPromises.readFile(htmlFilePath)).toString('utf-8');
                const { mtime } = await fsPromises.stat(htmlFilePath);

                if (fetchCache) {
                    const lastModified = mtime.getTime();
                    const parsedData = JSON.parse(htmlFileData) as CachedFetchValue;

                    cachedData = {
                        lastModified,
                        value: parsedData,
                    };

                    if (cachedData.value?.kind === 'FETCH') {
                        const storedTags = cachedData.value?.data?.tags;

                        // update stored tags if a new one is being added
                        // TODO: remove this when we can send the tags
                        // via header on GET same as SET
                        if (!tags?.every((tag) => storedTags?.includes(tag))) {
                            await this.set(cacheKey, cachedData.value, { tags });
                        }
                    }
                } else {
                    const { filePath } = await this.getFsPath({
                        pathname: isHtmlFileInAppPath ? `${cacheKey}.rsc` : `${cacheKey}.json`,
                        appDir: isHtmlFileInAppPath,
                    });
                    const fileData = (await fsPromises.readFile(filePath)).toString('utf-8');

                    const pageData = isHtmlFileInAppPath ? fileData : (JSON.parse(fileData) as object);

                    let meta: Partial<Meta> = {};

                    if (isHtmlFileInAppPath) {
                        try {
                            const metaFilePath = htmlFilePath.replace(/\.html$/, '.meta');
                            const metaFileData = await fsPromises.readFile(metaFilePath);
                            meta = JSON.parse(metaFileData.toString('utf-8')) as Partial<Meta>;
                        } catch {
                            // no .meta data for the related key
                        }
                    }

                    cachedData = {
                        lastModified: mtime.getTime(),
                        value: {
                            kind: 'PAGE',
                            html: htmlFileData,
                            pageData,
                            headers: meta.headers,
                            status: meta.status,
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
            const { filePath } = await this.getFsPath({
                pathname: `${cacheKey}.body`,
                appDir: true,
            });
            await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
            await fsPromises.writeFile(filePath, data.body);
            await fsPromises.writeFile(
                filePath.replace(/\.body$/, '.meta'),
                JSON.stringify({ headers: data.headers, status: data.status }),
            );

            return;
        }

        if (data.kind === 'PAGE') {
            const isAppPath = typeof data.pageData === 'string';
            const { filePath: htmlPath } = await this.getFsPath({
                pathname: `${cacheKey}.html`,
                appDir: isAppPath,
            });
            await fsPromises.mkdir(path.dirname(htmlPath), { recursive: true });
            await fsPromises.writeFile(htmlPath, data.html);

            await fsPromises.writeFile(
                (
                    await this.getFsPath({
                        pathname: `${cacheKey}.${isAppPath ? 'rsc' : 'json'}`,
                        appDir: isAppPath,
                    })
                ).filePath,
                isAppPath ? JSON.stringify(data.pageData) : JSON.stringify(data.pageData),
            );

            if (data.headers || data.status) {
                await fsPromises.writeFile(
                    htmlPath.replace(/\.html$/, '.meta'),
                    JSON.stringify({
                        headers: data.headers,
                        status: data.status,
                    }),
                );
            }
            return;
        }

        if (data.kind === 'FETCH') {
            const { filePath } = await this.getFsPath({
                pathname: cacheKey,
                fetchCache: true,
            });
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

        await IncrementalCache.cache.revalidateTag(tag, Date.now());

        if (!IncrementalCache.tagsManifestPath || IncrementalCache.diskAccessMode.includes('write-no')) {
            return;
        }

        const tagsManifest = await IncrementalCache.cache.getTagsManifest();

        try {
            await fsPromises.mkdir(path.dirname(IncrementalCache.tagsManifestPath), { recursive: true });
            await fsPromises.writeFile(IncrementalCache.tagsManifestPath, JSON.stringify(tagsManifest || {}));
        } catch (err) {
            // eslint-disable-next-line no-console -- Next.js logs it so we do too
            console.warn('Failed to update tags manifest.', err);
        }
    }

    // credits to Next.js for the following code
    private async getFsPath({
        pathname,
        appDir,
        fetchCache,
    }: {
        pathname: string;
        appDir?: boolean;
        fetchCache?: boolean;
    }): Promise<{
        filePath: string;
        isAppPath: boolean;
    }> {
        if (fetchCache) {
            // we store in .next/cache/fetch-cache so it can be persisted
            // across deploys
            return {
                filePath: path.join(this.serverDistDir, '..', 'cache', 'fetch-cache', pathname),
                isAppPath: false,
            };
        }
        const isAppPath = false;
        const filePath = path.join(this.serverDistDir, 'pages', pathname);

        if (!this.appDir || appDir === false) {
            return {
                filePath,
                isAppPath,
            };
        }

        try {
            await fsPromises.stat(filePath);
            return {
                filePath,
                isAppPath,
            };
        } catch (err) {
            return {
                filePath: path.join(this.serverDistDir, 'app', pathname),
                isAppPath: true,
            };
        }
    }
}
