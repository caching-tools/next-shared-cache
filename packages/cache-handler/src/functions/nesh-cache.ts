import assert from 'node:assert/strict';
import { type IncrementalCacheEntry, NEXT_CACHE_IMPLICIT_TAG_ID, type Revalidate } from '@repo/next-common';
import {
    type StaticGenerationStore,
    staticGenerationAsyncStorage,
} from 'next/dist/client/components/static-generation-async-storage.external.js';
import { TIME_ONE_YEAR } from '../constants';

function getDerivedTags(pathname: string): string[] {
    const derivedTags: string[] = ['/layout'];

    if (!pathname.startsWith('/')) {
        return derivedTags;
    }

    const pathnameParts = pathname.split('/');

    for (let i = 1; i < pathnameParts.length + 1; i++) {
        let curPathname = pathnameParts.slice(0, i).join('/');

        if (curPathname) {
            if (!(curPathname.endsWith('/page') || curPathname.endsWith('/route'))) {
                curPathname = `${curPathname}${curPathname.endsWith('/') ? '' : '/'}layout`;
            }

            derivedTags.push(curPathname);
        }
    }

    return derivedTags;
}

function addImplicitTags(staticGenerationStore: StaticGenerationStore) {
    const newTags: string[] = [];

    const { pagePath, urlPathname } = staticGenerationStore;

    if (!Array.isArray(staticGenerationStore.tags)) {
        staticGenerationStore.tags = [];
    }

    if (pagePath) {
        const derivedTags = getDerivedTags(pagePath);

        for (let tag of derivedTags) {
            tag = `${NEXT_CACHE_IMPLICIT_TAG_ID}${tag}`;
            if (!staticGenerationStore.tags?.includes(tag)) {
                staticGenerationStore.tags.push(tag);
            }
            newTags.push(tag);
        }
    }

    if (urlPathname) {
        const parsedPathname = new URL(urlPathname, 'http://n').pathname;

        const tag = `${NEXT_CACHE_IMPLICIT_TAG_ID}${parsedPathname}`;
        if (!staticGenerationStore.tags?.includes(tag)) {
            staticGenerationStore.tags.push(tag);
        }
        newTags.push(tag);
    }

    return newTags;
}

/**
 * Serializes the given arguments into a string representation.
 *
 * @param object - The arguments to be serialized.
 *
 * @returns The serialized string representation of the arguments.
 */
function serializeArguments(object: object): string {
    return JSON.stringify(object);
}

/**
 * Serializes the given object into a string representation.
 *
 * @param object - The object to be serialized.
 *
 * @returns The serialized string representation of the object.
 */
function serializeResult(object: object): string {
    return Buffer.from(JSON.stringify(object), 'utf-8').toString('base64');
}

/**
 * Deserializes a string representation of an object into its original form.
 *
 * @param string - The string representation of the object.
 *
 * @returns The deserialized object.
 */
function deserializeResult<T>(string: string): T {
    return JSON.parse(Buffer.from(string, 'base64').toString('utf-8'));
}

/**
 * @template Arguments - The type of the arguments passed to the callback function.
 *
 * @template Result - The type of the value returned by the callback function.
 */
type Callback<Arguments extends unknown[], Result> = (...args: Arguments) => Result;

/**
 * An object containing options for the cache.
 */
type NeshCacheOptions<Arguments extends unknown[], Result> = {
    /**
     * An array of tags to associate with the cached result.
     * Tags are used to revalidate the cache using the `revalidateTag` function.
     */
    tags?: string[];
    /**
     * The revalidation interval in seconds.
     * Must be a positive integer or `false` to disable revalidation.
     *
     * @default revalidate // of the current route
     */
    revalidate?: Revalidate;
    /**
     * A custom cache key to be used instead of creating one from the arguments.
     */
    cacheKey?: string;
    /**
     * A function that serializes the arguments passed to the callback function.
     * Use it to create a cache key.
     *
     * @default (args) => JSON.stringify(args)
     *
     * @param callbackArguments - The arguments passed to the callback function.
     */
    argumentsSerializer?(callbackArguments: Arguments): string;
    /**
     *
     * A function that serializes the result of the callback function.
     *
     * @default (result) => Buffer.from(JSON.stringify(result)).toString('base64')
     *
     * @param result - The result of the callback function.
     */
    resultSerializer?(result: Result): string;
    /**
     * A function that deserializes the string representation of the result of the callback function.
     *
     * @default (string) => JSON.parse(Buffer.from(string, 'base64').toString('utf-8'))
     *
     * @param string - The string representation of the result of the callback function.
     */
    resultDeserializer?(string: string): Result;
};

/**
 * An object containing common options for the cache.
 */
type CommonNeshCacheOptions<Arguments extends unknown[], Result> = Omit<
    NeshCacheOptions<Arguments, Result>,
    'cacheKey'
>;

/**
 * Experimental implementation of the "`unstable_cache`" function with more control over caching.
 *
 * The API may change in the future. Use with caution.
 *
 * Caches the result of a callback function and returns a cached version if available.
 * If not available, it executes the callback function, caches the result, and returns it.
 *
 * @param callback - The callback function to be cached.
 *
 * @param commonOptions - An object containing options for the cache.
 *
 * @param commonOptions.tags - An array of tags to associate with the cached result.
 * Tags are used to revalidate the cache using the `revalidateTag` function.
 *
 * @param commonOptions.revalidate - The revalidation interval in seconds.
 * Must be a positive integer or `false` to disable revalidation.
 * Defaults to `export const revalidate = time;` in the current route.
 *
 * @param commonOptions.argumentsSerializer - A function that serializes the arguments passed to the callback function.
 * Use it to create a cache key. Defaults to `JSON.stringify(args)`.
 *
 * @param commonOptions.resultSerializer - A function that serializes the result of the callback function.
 * Defaults to `Buffer.from(JSON.stringify(data)).toString('base64')`.
 *
 * @param commonOptions.resultDeserializer - A function that deserializes the string representation of the result of the callback function.
 * Defaults to `JSON.parse(Buffer.from(data, 'base64').toString('utf-8'))`.
 *
 * @returns The callback wrapped in a caching function.
 * First argument is the cache options which can be used to override the common options.
 * In addition, there is a `cacheKey` option that can be used to provide a custom cache key.
 *
 * @throws If the `neshCache` function is not used in a Next.js app directory or if the `revalidate` option is invalid.
 *
 * @remarks
 * - This function is intended to be used in a Next.js app directory.
 *
 * @since 1.2.0
 */
export function neshCache<Arguments extends unknown[], Result extends Promise<unknown>>(
    callback: Callback<Arguments, Result>,
    commonOptions?: CommonNeshCacheOptions<Arguments, Result>,
) {
    if (commonOptions?.resultSerializer && !commonOptions?.resultDeserializer) {
        throw new Error('neshCache: if you provide a resultSerializer, you must provide a resultDeserializer.');
    }

    if (commonOptions?.resultDeserializer && !commonOptions?.resultSerializer) {
        throw new Error('neshCache: if you provide a resultDeserializer, you must provide a resultSerializer.');
    }

    const commonTags = commonOptions?.tags ?? [];
    const commonRevalidate = commonOptions?.revalidate ?? false;
    const commonArgumentsSerializer = commonOptions?.argumentsSerializer ?? serializeArguments;
    const commonResultSerializer = commonOptions?.resultSerializer ?? serializeResult;
    const commonResultDeserializer = commonOptions?.resultDeserializer ?? deserializeResult;

    async function cachedCallback(
        options: NeshCacheOptions<Arguments, Result>,
        ...args: Arguments
    ): Promise<Result | null> {
        const store = staticGenerationAsyncStorage.getStore();

        assert(store?.incrementalCache, 'neshCache must be used in a Next.js app directory.');

        const {
            tags = [],
            revalidate = commonRevalidate,
            cacheKey,
            argumentsSerializer = commonArgumentsSerializer,
            resultDeserializer = commonResultDeserializer,
            resultSerializer = commonResultSerializer,
        } = options ?? {};

        assert(
            revalidate === false || (revalidate > 0 && Number.isInteger(revalidate)),
            'neshCache: revalidate must be a positive integer or false.',
        );

        if (store.fetchCache === 'force-no-store' || store.isDraftMode || store.incrementalCache.dev) {
            return await callback(...args);
        }

        const uniqueTags = new Set(store.tags);

        const combinedTags = [...tags, ...commonTags];

        for (const tag of combinedTags) {
            if (typeof tag === 'string') {
                uniqueTags.add(tag);
            } else {
                console.warn(`neshCache: Invalid tag: ${tag}. Skipping it. Expected a string.`);
            }
        }

        const allTags = Array.from(uniqueTags);

        // TODO: Find out why this is necessary
        store.tags = allTags;
        store.revalidate = revalidate;
        const fetchIdx = store.nextFetchId ?? 1;
        store.nextFetchId = fetchIdx + 1;

        const key = await store.incrementalCache.fetchCacheKey(`nesh-cache-${cacheKey ?? argumentsSerializer(args)}`);

        const handleUnlock = await store.incrementalCache.lock(key);

        let cacheData: IncrementalCacheEntry | null = null;

        let data: Result;

        try {
            cacheData = await store.incrementalCache.get(key, {
                revalidate,
                tags: allTags,
                softTags: addImplicitTags(store),
                kindHint: 'fetch',
                fetchIdx,
                fetchUrl: 'neshCache',
            });

            if (cacheData?.value?.kind === 'FETCH' && cacheData.isStale === false) {
                await handleUnlock();

                return resultDeserializer(cacheData.value.data.body);
            }

            data = await staticGenerationAsyncStorage.run(
                {
                    ...store,
                    // force any nested fetches to bypass cache so they revalidate
                    // when the unstable_cache call is revalidated
                    fetchCache: 'force-no-store',
                },
                callback,
                ...args,
            );
        } catch (error) {
            throw error;
        } finally {
            await handleUnlock();
        }

        store.incrementalCache.set(
            key,
            {
                kind: 'FETCH',
                data: {
                    body: resultSerializer(data),
                    headers: {},
                    url: 'neshCache',
                },
                revalidate: revalidate || TIME_ONE_YEAR,
            },
            { revalidate, tags, fetchCache: true, fetchIdx, fetchUrl: 'neshCache' },
        );

        return data;
    }

    return cachedCallback;
}
