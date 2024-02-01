import fs, { promises as fsPromises } from 'node:fs';
import path from 'node:path';

import type {
    CacheHandler,
    CacheHandlerParametersGet,
    CacheHandlerParametersRevalidateTag,
    CacheHandlerParametersSet,
    CacheHandlerValue,
    CachedFetchValue,
    FileSystemCacheContext,
    IncrementalCacheKindHint,
    IncrementalCacheValue,
    NonNullableRouteMetadata,
    PrerenderManifest,
    RouteMetadata,
    TagsManifest,
} from '@neshca/next-common';

import { UseTtlOptions } from './common-types';
import { checkIfAgeIsGreaterThatEvictionAge } from './helpers/check-if-age-is-greater-that-eviction-age';
import { isTagsManifest } from './helpers/is-tags-manifest';

const RSC_PREFETCH_SUFFIX = '.prefetch.rsc';
const RSC_SUFFIX = '.rsc';
const NEXT_DATA_SUFFIX = '.json';
const NEXT_META_SUFFIX = '.meta';

export type { CacheHandlerValue };

export type RevalidatedTags = Record<string, number>;

/**
 * Represents a custom cache implementation. This interface defines essential methods for cache operations.
 */
export type Cache = {
    /**
     * A descriptive name for the cache handler instance.
     */
    name?: string;
    /**
     * Retrieves the value associated with the given key from the cache.
     *
     * @param key - The unique string identifier for the cache entry.
     *
     * @param maxAgeSeconds - Optional. Delay in seconds before the cache entry becomes stale.
     * If undefined, the cache entry will not become stale.
     *
     * @returns A Promise that resolves to the cached value (if found), `null` or `undefined` if the entry is not found.
     */
    get: (
        key: string,
        maxAgeSeconds?: number,
        useGlobalTtl?: UseTtlOptions['useTtl'],
    ) => Promise<CacheHandlerValue | null | undefined>;
    /**
     * Sets or updates a value in the cache store.
     *
     * @param key - The unique string identifier for the cache entry.
     *
     * @param value - The value to be stored in the cache.
     *
     * @param maxAgeSeconds - Optional. Delay in seconds before the cache entry becomes stale.
     * If undefined, the cache entry will not become stale.
     *
     * @returns A Promise with no value.
     */
    set: (
        key: string,
        value: CacheHandlerValue,
        maxAgeSeconds?: number,
        useGlobalTtl?: UseTtlOptions['useTtl'],
    ) => Promise<void>;
    /**
     * Retrieves the {@link RevalidatedTags} object.
     *
     * @returns A Promise that resolves to a {@link RevalidatedTags} object
     * or either `null` or `undefined` for using tags from the next cache layer
     * or a locally maintained {@link RevalidatedTags}.
     */
    getRevalidatedTags?: () => Promise<RevalidatedTags | null | undefined>;
    /**
     * Marks a specific cache tag as revalidated. Useful for cache invalidation strategies.
     *
     * @param tag - The tag to be marked as revalidated.
     *
     * @param revalidatedAt - The timestamp (in milliseconds) of when the tag was revalidated.
     */
    revalidateTag?: (tag: string, revalidatedAt: number) => Promise<void>;
};

type NamedCache = Cache & {
    /**
     * A descriptive name or an index for the cache instance.
     */
    name: string;
};

/**
 * Configuration options for cache behavior.
 */
export type CacheConfig = {
    /**
     * Determines whether to use the file system caching in addition to the provided cache.
     */
    useFileSystem?: boolean;
    /**
     * A custom cache instance or an array of cache instances that conform to the Cache interface.
     * Multiple caches can be used to implement various caching strategies or layers.
     */
    cache: Cache | (Cache | undefined | null)[];
    experimental?: {
        useGlobalTtl?: UseTtlOptions['useTtl'];
    };
};

/**
 * Contextual information provided during cache creation, including server directory paths and environment mode.
 */
export type CacheCreationContext = {
    /**
     * The absolute path to the Next.js server directory.
     */
    serverDistDir: string;
    /**
     * Indicates if the Next.js application is running in development mode.
     * When in development mode, caching behavior might differ.
     */
    dev?: boolean;
    /**
     * The unique identifier for the current build of the Next.js application.
     * This build ID is generated during the `next build` process and is used
     * to ensure consistency across multiple instances of the application,
     * especially when running in containerized environments. It helps in
     * identifying which version of the application is being served.
     *
     * https://nextjs.org/docs/pages/building-your-application/deploying#build-cache
     *
     * @remarks
     * Some cache values may be lost during the build process
     * because the `buildId` is defined after some cache values have already been set.
     * However, `buildId` will be defined from the beginning when you start your app.
     *
     * @example
     * ```js
     * // cache-handler.mjs
     * IncrementalCache.onCreation(async ({ buildId }) => {
     *   let redisCache;
     *
     *   if (buildId) {
     *     await client.connect();
     *
     *     redisCache = await createRedisCache({
     *       client,
     *       keyPrefix: `${buildId}:`,
     *     });
     *   }
     *
     *   const localCache = createLruCache();
     *
     *   return {
     *     cache: [redisCache, localCache],
     *     useFileSystem: true,
     *   };
     * });
     * ```
     */
    buildId?: string;
};

/**
 * Represents a function that retrieves a {@link CacheConfig} based on provided options and your custom logic.
 *
 * @typeParam T - The type of the options object that the function accepts.
 *
 * @param options - An options object of type T, containing parameters that influence the cache configuration.
 *
 * @returns Either a CacheConfig object or a Promise that resolves to a {@link CacheConfig} object,
 * which specifies the cache behavior and settings.
 */
export type CreateCache<T> = (options: T) => Promise<CacheConfig> | CacheConfig;

/**
 * Represents a hook function that is called during the creation of the cache. This function allows for custom logic
 * to be executed at the time of cache instantiation, enabling dynamic configuration or initialization tasks.
 *
 * The function can either return a {@link CacheConfig} object directly or a Promise that resolves to a {@link CacheConfig},
 * allowing for asynchronous operations if needed.
 *
 * @param cacheCreationContext - The {@link CacheCreationContext} object, providing contextual information about the cache creation environment,
 * such as server directory paths and whether the application is running in development mode.
 *
 * @returns Either a CacheConfig object or a Promise that resolves to a {@link CacheConfig}, specifying how the cache should be configured.
 */
export type OnCreationHook = (cacheCreationContext: CacheCreationContext) => Promise<CacheConfig> | CacheConfig;

export class IncrementalCache implements CacheHandler {
    /**
     * Provides a descriptive name for the IncrementalCache class.
     *
     * The name includes the number of handlers and whether file system caching is used.
     * If the cache handler is not configured yet, it will return a string indicating so.
     *
     * This property is primarily intended for debugging purposes
     * and its visibility is controlled by the `NEXT_PRIVATE_DEBUG_CACHE` environment variable.
     *
     * @returns A string describing the cache handler configuration.
     *
     * @example
     * ```js
     * // cache-handler.mjs
     * IncrementalCache.onCreation(async () => {
     *  const = redisCache = await createRedisCache({
     *    client,
     *  });
     *
     *   const localCache = createLruCache();
     *
     *   return {
     *     cache: [redisCache, localCache],
     *     useFileSystem: true,
     *   };
     * });
     *
     * // after the Next.js called the onCreation hook
     * console.log(IncrementalCache.name);
     * // Output: "@neshca/cache-handler with 2 Handlers and file system caching"
     * ```
     */
    public static get name(): string {
        if (IncrementalCache.#cacheListLength === undefined) {
            return '@neshca/cache-handler is not configured yet';
        }

        return `@neshca/cache-handler with ${IncrementalCache.#cacheListLength} Handler${
            IncrementalCache.#cacheListLength > 1 ? 's' : ''
        } and ${IncrementalCache.#useFileSystem ? 'file system' : 'no file system'} caching`;
    }

    static #resolveCreationPromise: () => void;

    static #rejectCreationPromise: (error: unknown) => void;

    /**
     * A Promise that resolves when the `IncrementalCache.configureIncrementalCache` function has been called and the cache has been configured.
     * It prevents the cache from being used before it's ready.
     */
    static readonly #creationPromise: Promise<void> = new Promise<void>((resolve, reject) => {
        this.#resolveCreationPromise = resolve;
        this.#rejectCreationPromise = reject;
    });

    /**
     * Indicates whether the pages directory exists in the cache handler.
     * This is a fallback for when the `context._pagesDir` is not provided by Next.js.
     */
    static #hasPagesDir = false;

    /**
     * Determines whether to use the file system caching in addition to the provided cache.
     */
    static #useFileSystem = true;

    static #cache: Cache;

    static #cacheListLength: number;

    static #tagsManifestPath: string;

    static #revalidatedTags: RevalidatedTags = {};

    static #debug = typeof process.env.NEXT_PRIVATE_DEBUG_CACHE !== 'undefined';

    static #onCreationHook: OnCreationHook;

    static #useGlobalTtl?: UseTtlOptions['useTtl'];

    static readonly #initialRevalidationTimes: Map<string, number | false> = new Map();

    static readonly #prerenderedPagesWithFallbackFalse: Set<string> = new Set();

    static readonly #runtimeRevalidationTimes: Map<string, number | false> = new Map();

    /**
     * Registers a hook to be called during the creation of an IncrementalCache instance.
     * This method allows for custom cache configurations to be applied at the time of cache instantiation.
     *
     * The provided {@link OnCreationHook} function can perform initialization tasks, modify cache settings,
     * or integrate additional logic into the cache creation process. This function can either return a {@link CacheConfig}
     * object directly for synchronous operations, or a `Promise` that resolves to a {@link CacheConfig} for asynchronous operations.
     *
     * Usage of this method is typically for advanced scenarios where default caching behavior needs to be altered
     * or extended based on specific application requirements or environmental conditions.
     *
     * @param onCreationHook - The {@link OnCreationHook} function to be called during cache creation.
     */
    public static onCreation(onCreationHook: OnCreationHook): void {
        IncrementalCache.#onCreationHook = onCreationHook;
    }

    static async #configureIncrementalCache(cacheCreationContext: CacheCreationContext): Promise<void> {
        // Retrieve cache configuration by invoking the onCreation hook with the provided context
        const config = IncrementalCache.#onCreationHook(cacheCreationContext);

        // Destructure the cache and useFileSystem settings from the configuration
        // Await the configuration if it's a promise
        const { cache, useFileSystem = true, experimental } = config instanceof Promise ? await config : config;

        // Extract the server distribution directory from the cache creation context
        const { serverDistDir } = cacheCreationContext;

        // Set the class-level flag to determine if the file system caching should be used
        IncrementalCache.#useFileSystem = useFileSystem;

        IncrementalCache.#useGlobalTtl = experimental?.useGlobalTtl;

        // Check if the pages directory exists and set the flag accordingly
        IncrementalCache.#hasPagesDir = fs.existsSync(path.join(serverDistDir, 'pages'));

        // Define the path for the tags manifest file
        IncrementalCache.#tagsManifestPath = path.join(
            serverDistDir,
            '..',
            'cache',
            'fetch-cache',
            'tags-manifest.json',
        );

        try {
            // Ensure the directory for the tags manifest exists
            await fsPromises.mkdir(path.dirname(IncrementalCache.#tagsManifestPath), { recursive: true });

            // Read the tags manifest from the file system
            const tagsManifestData = await fsPromises.readFile(IncrementalCache.#tagsManifestPath, 'utf-8');

            // Parse the tags manifest data
            const tagsManifestFromFileSystem = JSON.parse(tagsManifestData) as unknown;

            // Update the local RevalidatedTags if the parsed data is a valid tags manifest
            if (isTagsManifest(tagsManifestFromFileSystem)) {
                IncrementalCache.#revalidatedTags = Object.entries(
                    tagsManifestFromFileSystem.items,
                ).reduce<RevalidatedTags>((revalidatedTags, [tag, { revalidatedAt }]) => {
                    revalidatedTags[tag] = revalidatedAt;

                    return revalidatedTags;
                }, {});
            }
        } catch (_error) {
            // If the file doesn't exist, use the default tagsManifest
        }

        try {
            // Read the prerender manifest from the file system
            const prerenderManifestFilePath = path.join(serverDistDir, '..', 'prerender-manifest.json');
            const prerenderManifestFile = await fsPromises.readFile(prerenderManifestFilePath, 'utf-8');
            const prerenderManifest = JSON.parse(prerenderManifestFile) as PrerenderManifest;

            for (const [cacheKey, { initialRevalidateSeconds, srcRoute }] of Object.entries(prerenderManifest.routes)) {
                // store the initial revalidation times
                IncrementalCache.#initialRevalidationTimes.set(cacheKey, initialRevalidateSeconds);

                // store the pages with `fallback: false`
                if (srcRoute && prerenderManifest.dynamicRoutes[srcRoute]?.fallback === false) {
                    IncrementalCache.#prerenderedPagesWithFallbackFalse.add(cacheKey);
                }
            }
        } catch (_error) {}

        const cacheList: NamedCache[] = Array.isArray(cache)
            ? cache.reduce<NamedCache[]>((items, cacheItem, index) => {
                  if (cacheItem) {
                      items.push({
                          ...cacheItem,
                          name: cacheItem.name || index.toString(),
                      });
                  }

                  return items;
              }, [])
            : [{ name: '0', ...cache }];

        IncrementalCache.#cacheListLength = cacheList.length;

        // if no cache is provided and we don't use the file system
        if (cacheList.length === 0 && !IncrementalCache.#useFileSystem) {
            throw new Error(
                'No cache provided and file system caching is disabled. Please provide a cache or enable file system caching.',
            );
        }

        IncrementalCache.#cache = {
            async get(key, maxAgeSeconds) {
                for await (const cacheItem of cacheList) {
                    try {
                        const cacheValue = await cacheItem.get(key, maxAgeSeconds, IncrementalCache.#useGlobalTtl);

                        if (IncrementalCache.#debug) {
                            console.info(`get from "${cacheItem.name}"`, key, Boolean(cacheValue));
                        }

                        return cacheValue;
                    } catch (error) {
                        if (IncrementalCache.#debug) {
                            console.warn(
                                `Cache handler "${cacheItem.name}" failed to get value for key "${key}".`,
                                error,
                            );
                        }
                    }
                }

                return null;
            },
            async set(key, value, maxAgeSeconds) {
                await Promise.allSettled(
                    cacheList.map((cacheItem) => {
                        try {
                            return cacheItem.set(key, value, maxAgeSeconds, IncrementalCache.#useGlobalTtl);
                        } catch (error) {
                            if (IncrementalCache.#debug) {
                                console.warn(
                                    `Cache handler "${cacheItem.name}" failed to set value for key "${key}".`,
                                    error,
                                );
                            }
                        }

                        return Promise.resolve();
                    }),
                );
            },
            async getRevalidatedTags() {
                for await (const cacheItem of cacheList) {
                    try {
                        const revalidatedTags = await cacheItem.getRevalidatedTags?.();

                        return revalidatedTags;
                    } catch (error) {
                        if (IncrementalCache.#debug) {
                            // eslint-disable-next-line no-console -- we want to log this
                            console.warn(`Cache handler "${cacheItem.name}" failed to get revalidated tags.`, error);
                        }
                    }
                }
            },
            async revalidateTag(tag, revalidatedAt) {
                await Promise.allSettled(
                    cacheList.map((cacheItem) => {
                        try {
                            return cacheItem.revalidateTag?.(tag, revalidatedAt);
                        } catch (error) {
                            if (IncrementalCache.#debug) {
                                // eslint-disable-next-line no-console -- we want to log this
                                console.warn(
                                    `Cache handler "${cacheItem.name}" failed to revalidate tag "${tag}".`,
                                    error,
                                );
                            }
                        }

                        return Promise.resolve();
                    }),
                );
            },
        };
    }

    readonly #revalidatedTagsArray: FileSystemCacheContext['revalidatedTags'];
    readonly #appDir: FileSystemCacheContext['_appDir'];
    readonly #pagesDir: FileSystemCacheContext['_pagesDir'] | undefined;
    readonly #serverDistDir: FileSystemCacheContext['serverDistDir'];
    readonly #experimental: FileSystemCacheContext['experimental'];

    public constructor(context: FileSystemCacheContext) {
        this.#revalidatedTagsArray = context.revalidatedTags ?? [];
        this.#appDir = Boolean(context._appDir);
        this.#pagesDir = context._pagesDir;
        this.#serverDistDir = context.serverDistDir;
        this.#experimental = { ppr: context?.experimental?.ppr ?? false };

        if (!IncrementalCache.#cache) {
            let buildId: string | undefined;

            try {
                buildId = fs.readFileSync(path.join(this.#serverDistDir, '..', 'BUILD_ID'), 'utf-8');
            } catch (_error) {
                buildId = undefined;
            }

            IncrementalCache.#configureIncrementalCache({
                dev: context.dev,
                serverDistDir: this.#serverDistDir,
                buildId,
            })
                .then(IncrementalCache.#resolveCreationPromise)
                .catch(IncrementalCache.#rejectCreationPromise);
        }
    }

    async #readCacheFromFileSystem(
        cacheKey: string,
        kindHint?: IncrementalCacheKindHint,
        tags?: string[],
        maxAgeSeconds?: number,
    ): Promise<CacheHandlerValue | null> {
        let cachedData: CacheHandlerValue | null = null;

        try {
            const bodyFilePath = this.#getFilePath(`${cacheKey}.body`, 'app');

            const { mtime } = await fsPromises.stat(bodyFilePath);

            const lastModified = mtime.getTime();

            if (checkIfAgeIsGreaterThatEvictionAge(lastModified, maxAgeSeconds, IncrementalCache.#useGlobalTtl)) {
                return null;
            }

            const bodyFileData = fs.readFileSync(bodyFilePath);

            const metaFileData = await fsPromises.readFile(bodyFilePath.replace(/\.body$/, NEXT_META_SUFFIX), 'utf-8');
            const meta: NonNullableRouteMetadata = JSON.parse(metaFileData) as NonNullableRouteMetadata;

            const cacheEntry: CacheHandlerValue = {
                lastModified,
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
                kind = this.#detectFileKind(`${cacheKey}.html`);
            }

            const isAppPath = kind === 'app';
            const pageFilePath = this.#getFilePath(kind === 'fetch' ? cacheKey : `${cacheKey}.html`, kind);

            const { mtime } = await fsPromises.stat(pageFilePath);

            const lastModified = mtime.getTime();

            const pageHasFallbackFalse = IncrementalCache.#prerenderedPagesWithFallbackFalse.has(cacheKey);
            const pageShouldNotBeServed = checkIfAgeIsGreaterThatEvictionAge(
                lastModified,
                maxAgeSeconds,
                IncrementalCache.#useGlobalTtl,
            );

            // if the page has `fallback: false` and is stale we don't return it
            // as it would be a 404. See https://github.com/vercel/next.js/issues/58094
            if (!pageHasFallbackFalse && pageShouldNotBeServed) {
                return null;
            }

            const pageFile = fs.readFileSync(pageFilePath, 'utf-8');

            if (kind === 'fetch') {
                const parsedData = JSON.parse(pageFile) as CachedFetchValue;

                cachedData = {
                    lastModified,
                    value: parsedData,
                };

                if (cachedData.value?.kind === 'FETCH') {
                    const cachedTags = cachedData.value.tags;

                    // update stored tags if a new one is being added
                    // TODO: remove this when we can send the tags
                    // via header on GET same as SET
                    if (!tags?.every((tag) => cachedTags?.includes(tag))) {
                        if (IncrementalCache.#debug) {
                            console.info('tags vs cachedTags mismatch', tags, cachedTags);
                        }
                        await this.set(cacheKey, cachedData.value, { tags });
                    }
                }
            } else {
                const pageDataFilePath = isAppPath
                    ? this.#getFilePath(
                          `${cacheKey}${this.#experimental.ppr ? RSC_PREFETCH_SUFFIX : RSC_SUFFIX}`,
                          'app',
                      )
                    : this.#getFilePath(`${cacheKey}${NEXT_DATA_SUFFIX}`, 'pages');

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
                    lastModified,
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
        } catch (_) {
            // unable to get data from the file system
        }

        return cachedData;
    }

    async #revalidateCachedData(cachedData: CacheHandlerValue, tags: string[], softTags: string[]): Promise<boolean> {
        // credits to Next.js for the following code
        if (cachedData.value?.kind === 'PAGE') {
            let cacheTags: undefined | string[];
            const tagsHeader = cachedData.value.headers?.['x-next-cache-tags'];

            if (typeof tagsHeader === 'string') {
                cacheTags = tagsHeader.split(',');
            }

            const revalidatedTags =
                (await IncrementalCache.#cache.getRevalidatedTags?.()) ?? IncrementalCache.#revalidatedTags;

            if (cacheTags?.length) {
                const isStale = cacheTags.some((tag) => {
                    const revalidatedAt = revalidatedTags[tag];

                    return (
                        typeof revalidatedAt === 'number' && revalidatedAt >= (cachedData?.lastModified || Date.now())
                    );
                });

                // we trigger a blocking validation if an ISR page
                // had a tag revalidated, if we want to be a background
                // revalidation instead we return cachedData.lastModified = -1
                return isStale;
            }
        }

        if (cachedData.value?.kind === 'FETCH') {
            const combinedTags = [...tags, ...softTags];

            const revalidatedTags =
                (await IncrementalCache.#cache.getRevalidatedTags?.()) ?? IncrementalCache.#revalidatedTags;

            const wasRevalidated = combinedTags.some((tag: string) => {
                if (this.#revalidatedTagsArray.includes(tag)) {
                    return true;
                }

                const revalidatedAt = revalidatedTags[tag];

                return typeof revalidatedAt === 'number' && revalidatedAt >= (cachedData?.lastModified || Date.now());
            });

            // When revalidate tag is called we don't return
            // stale cachedData so it's updated right away
            return wasRevalidated;
        }

        return false;
    }

    public async get(...args: CacheHandlerParametersGet): Promise<CacheHandlerValue | null> {
        const [cacheKey, ctx = {}] = args;

        const { tags = [], softTags = [], kindHint, revalidate: ctxRevalidate } = ctx;

        await IncrementalCache.#creationPromise;

        const maxAgeSeconds =
            (ctxRevalidate ??
                IncrementalCache.#runtimeRevalidationTimes.get(cacheKey) ??
                IncrementalCache.#initialRevalidationTimes.get(cacheKey)) ||
            undefined;

        let cachedData: CacheHandlerValue | null = (await IncrementalCache.#cache.get(cacheKey, maxAgeSeconds)) ?? null;

        if (!cachedData && IncrementalCache.#useFileSystem) {
            cachedData = await this.#readCacheFromFileSystem(cacheKey, kindHint, tags, maxAgeSeconds);

            if (IncrementalCache.#debug) {
                console.info('get from file system', cacheKey, tags, kindHint, Boolean(cachedData));
            }

            if (cachedData) {
                await IncrementalCache.#cache.set(cacheKey, cachedData);
            }
        }

        if (!cachedData) {
            return null;
        }

        const revalidated = await this.#revalidateCachedData(cachedData, tags, softTags);

        if (revalidated) {
            return null;
        }

        return cachedData;
    }

    async #writeCacheToFileSystem(data: IncrementalCacheValue, cacheKey: string, tags: string[] = []): Promise<void> {
        // credits to Next.js for the following code
        if (data.kind === 'ROUTE') {
            const filePath = this.#getFilePath(`${cacheKey}.body`, 'app');

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
            const htmlPath = this.#getFilePath(`${cacheKey}.html`, isAppPath ? 'app' : 'pages');
            await fsPromises.mkdir(path.dirname(htmlPath), { recursive: true });
            await fsPromises.writeFile(htmlPath, data.html);

            await fsPromises.writeFile(
                this.#getFilePath(
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
            const filePath = this.#getFilePath(cacheKey, 'fetch');

            await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
            await fsPromises.writeFile(
                filePath,
                JSON.stringify({
                    ...data,
                    tags,
                }),
            );
        }
    }

    public async set(...args: CacheHandlerParametersSet): Promise<void> {
        const [cacheKey, data, ctx] = args;

        const { revalidate: maxAgeSeconds, tags } = ctx;

        await IncrementalCache.#creationPromise;

        await IncrementalCache.#cache.set(
            cacheKey,
            {
                value: data,
                lastModified: Date.now(),
            },
            maxAgeSeconds || undefined,
        );

        if (data?.kind === 'PAGE' && typeof maxAgeSeconds !== 'undefined') {
            IncrementalCache.#runtimeRevalidationTimes.set(cacheKey, maxAgeSeconds);
        }

        if (IncrementalCache.#debug) {
            console.info('set to external cache store', cacheKey);
        }

        if (data && IncrementalCache.#useFileSystem) {
            await this.#writeCacheToFileSystem(data, cacheKey, tags);

            if (IncrementalCache.#debug) {
                console.info('set to file system', cacheKey);
            }
        }
    }

    public async revalidateTag(...args: CacheHandlerParametersRevalidateTag): Promise<void> {
        const [tag] = args;

        if (IncrementalCache.#debug) {
            console.info('revalidateTag', tag);
        }

        await IncrementalCache.#creationPromise;

        await IncrementalCache.#cache.revalidateTag?.(tag, Date.now());

        if (IncrementalCache.#debug) {
            console.info('updated external revalidated tags');
        }

        IncrementalCache.#revalidatedTags[tag] = Date.now();

        if (IncrementalCache.#debug) {
            console.info('updated local revalidated tags');
        }

        try {
            const tagsManifest = Object.entries(IncrementalCache.#revalidatedTags).reduce<TagsManifest>(
                (acc, [revalidatedTag, revalidatedAt]) => {
                    acc.items[revalidatedTag] = {
                        revalidatedAt,
                    };

                    return acc;
                },
                {
                    version: 1,
                    items: {},
                },
            );

            await fsPromises.writeFile(IncrementalCache.#tagsManifestPath, JSON.stringify(tagsManifest));
            if (IncrementalCache.#debug) {
                console.info('updated tags manifest file');
            }
        } catch (error) {
            // eslint-disable-next-line no-console -- we want to log this
            console.warn('failed to update tags manifest.', error);
        }
    }

    // credits to Next.js for the following code
    #detectFileKind(pathname: string): 'app' | 'pages' {
        const pagesDir = this.#pagesDir ?? IncrementalCache.#hasPagesDir;

        if (!this.#appDir && !pagesDir) {
            throw new Error("Invariant: Can't determine file path kind, no page directory enabled");
        }

        // If app directory isn't enabled, then assume it's pages and avoid the fs
        // hit.
        if (!this.#appDir && pagesDir) {
            return 'pages';
        }
        // Otherwise assume it's a pages file if the pages directory isn't enabled.
        if (this.#appDir && !pagesDir) {
            return 'app';
        }

        // If both are enabled, we need to test each in order, starting with
        // `pages`.
        let filePath = this.#getFilePath(pathname, 'pages');
        if (fs.existsSync(filePath)) {
            return 'pages';
        }

        filePath = this.#getFilePath(pathname, 'app');
        if (fs.existsSync(filePath)) {
            return 'app';
        }

        throw new Error(`Invariant: Unable to determine file path kind for ${pathname}`);
    }

    // credits to Next.js for the following code
    #getFilePath(pathname: string, kind: 'app' | 'fetch' | 'pages'): string {
        switch (kind) {
            case 'fetch':
                // we store in .next/cache/fetch-cache so it can be persisted
                // across deploys
                return path.join(this.#serverDistDir, '..', 'cache', 'fetch-cache', pathname);
            case 'pages':
                return path.join(this.#serverDistDir, 'pages', pathname);
            case 'app':
                return path.join(this.#serverDistDir, 'app', pathname);
            default:
                throw new Error("Invariant: Can't determine file path kind");
        }
    }

    resetRequestCache(): void {
        // not implemented yet
    }
}
