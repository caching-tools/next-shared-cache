/* eslint-disable @typescript-eslint/method-signature-style -- need to use a method style */

import path from 'node:path';
import type { OutgoingHttpHeaders } from 'node:http';
import type {
    CacheHandler,
    CacheHandlerValue,
    CacheHandlerParametersSet,
    CacheHandlerParametersGet,
    TagsManifest,
    CacheHandlerContext,
    CachedFetchValue,
    CacheHandlerParametersRevalidateTag,
} from '@neshca/next-types';

type Meta = { status: number; headers: OutgoingHttpHeaders };

export type Cache = {
    get(key: string): Promise<CacheHandlerValue | null | undefined>;
    set(key: string, value: unknown, ttl?: number): Promise<void>;
    getTagsManifest(prefix: string): Promise<TagsManifest | null | undefined>;
    revalidateTag(prefix: string, tag: string, revalidatedAt: number): Promise<void>;
};

type CacheMode = 'ttl' | 'not-ttl';

const NEXT_CACHE_TAGS_HEADER = 'x-next-cache-tags';

export class IncrementalCache implements CacheHandler {
    public static prefix = '';

    public static ttlMode: CacheMode = 'not-ttl';

    public static cache: Cache | null = null;

    private static getPrefixedCacheKey(cacheKey: string): string {
        return `${this.prefix}${cacheKey}`;
    }

    private static async getTagsManifest(): Promise<TagsManifest> {
        return (await this.cache?.getTagsManifest(this.prefix)) ?? { items: {}, version: 1 };
    }

    revalidatedTags: CacheHandlerContext['revalidatedTags'];
    appDir: NonNullable<CacheHandlerContext['_appDir']>;
    serverDistDir: NonNullable<CacheHandlerContext['serverDistDir']>;
    fs: NonNullable<CacheHandlerContext['fs']>;

    public constructor(context: CacheHandlerContext) {
        this.revalidatedTags = context.revalidatedTags;
        this.appDir = context._appDir;

        if (!context.fs) {
            throw new Error('fs is required');
        }

        if (!context.serverDistDir) {
            throw new Error('serverDistDir is required');
        }

        this.fs = context.fs;
        this.serverDistDir = context.serverDistDir;
    }

    public async get(...args: CacheHandlerParametersGet): Promise<CacheHandlerValue | null> {
        const [cacheKey, ctx = {}] = args;

        const { tags = [], softTags = [], fetchCache } = ctx;

        const prefixedCacheKey = IncrementalCache.getPrefixedCacheKey(cacheKey);

        let cachedData: CacheHandlerValue | null = null;

        try {
            cachedData = (await IncrementalCache.cache?.get(prefixedCacheKey)) ?? null;
        } catch (error) {
            return null;
        }

        if (!cachedData && IncrementalCache.ttlMode === 'not-ttl') {
            try {
                const { filePath } = await this.getFsPath({
                    pathname: `${cacheKey}.body`,
                    appDir: true,
                });

                const fileData = await this.fs.readFile(filePath);
                const { mtime } = await this.fs.stat(filePath);

                const metaFilePath = filePath.replace(/\.body$/, '.meta');
                const metaFileData = await this.fs.readFile(metaFilePath);
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
                const htmlFileData = (await this.fs.readFile(htmlFilePath)).toString('utf-8');
                const { mtime } = await this.fs.stat(htmlFilePath);

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
                    const fileData = (await this.fs.readFile(filePath)).toString('utf-8');

                    const pageData = isHtmlFileInAppPath ? fileData : (JSON.parse(fileData) as object);

                    let meta: Partial<Meta> = {};

                    if (isHtmlFileInAppPath) {
                        try {
                            const metaFilePath = htmlFilePath.replace(/\.html$/, '.meta');
                            const metaFileData = await this.fs.readFile(metaFilePath);
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
                    await IncrementalCache.cache?.set(prefixedCacheKey, cachedData);
                }
            } catch (_) {
                // unable to get data from disk
            }
        }

        if (cachedData?.value?.kind === 'PAGE') {
            let cacheTags: undefined | string[];
            const tagsHeader = cachedData.value.headers?.[NEXT_CACHE_TAGS_HEADER as string];

            if (typeof tagsHeader === 'string') {
                cacheTags = tagsHeader.split(',');
            }

            const tagsManifest = await IncrementalCache.getTagsManifest();

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

        if (cachedData?.value?.kind === 'FETCH') {
            const combinedTags = [...tags, ...softTags];

            const tagsManifest = await IncrementalCache.getTagsManifest();

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

    /**
     * set
     */
    public async set(...args: CacheHandlerParametersSet): Promise<void> {
        const [cacheKey, data, ctx] = args;

        const prefixedCacheKey = IncrementalCache.getPrefixedCacheKey(cacheKey);

        let ttl: number | undefined;

        const { revalidate } = ctx;

        if (IncrementalCache.ttlMode === 'ttl' && typeof revalidate === 'number') {
            ttl = revalidate;
        }

        await IncrementalCache.cache?.set(
            prefixedCacheKey,
            {
                value: data,
                lastModified: Date.now(),
            },
            ttl,
        );
    }

    /**
     * revalidatedTags
     */
    public async revalidateTag(...args: CacheHandlerParametersRevalidateTag): Promise<void> {
        const [tag] = args;

        await IncrementalCache.cache?.revalidateTag(IncrementalCache.prefix, tag, Date.now());
    }

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

        if (!this.appDir || appDir === false)
            return {
                filePath,
                isAppPath,
            };
        try {
            await this.fs.readFile(filePath);
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
