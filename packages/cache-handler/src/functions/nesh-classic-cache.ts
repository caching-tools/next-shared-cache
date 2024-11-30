import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import type { Revalidate } from '@repo/next-common';
import { staticGenerationAsyncStorage } from 'next/dist/client/components/static-generation-async-storage.external.js';
import type { IncrementalCache } from 'next/dist/server/lib/incremental-cache';
import type { CacheHandler } from '../cache-handler';
import { TIME_ONE_YEAR } from '../constants';

declare global {
    var __incrementalCache: IncrementalCache | undefined;
}

function hashCacheKey(url: string): string {
    // this should be bumped anytime a fix is made to cache entries
    // that should bust the cache
    const MAIN_KEY_PREFIX = 'nesh-pages-cache-v1';

    const cacheString = JSON.stringify([MAIN_KEY_PREFIX, url]);

    return createHash('sha256').update(cacheString).digest('hex');
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
type NeshClassicCacheOptions<Arguments extends unknown[], Result> = {
    /**
     * The response context object.
     * It is used to set the cache headers.
     */
    responseContext?: object & {
        setHeader(name: string, value: number | string | readonly string[]): unknown;
    };
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
type CommonNeshClassicCacheOptions<Arguments extends unknown[], Result> = Omit<
    NeshClassicCacheOptions<Arguments, Result>,
    'cacheKey' | 'responseContext'
>;

/**
 * Experimental implementation of the "`unstable_cache`" for classic Next.js Pages Router.
 * It allows to cache data in the `getServerSideProps` and API routes.
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
 * @param commonOptions.responseContext - The response context object.
 * It is used to set the cache headers.
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
 * @throws If the `neshClassicCache` function is not used in a Next.js Pages directory or if the `revalidate` option is invalid.
 *
 * @example file: `src/pages/api/api-example.js`
 *
 * ```js
 * import { neshClassicCache } from '@neshca/cache-handler/functions';
 * import axios from 'axios';
 *
 * export const config = {
 *   runtime: 'nodejs',
 * };
 *
 * async function getViaAxios(url) {
 *   try {
 *     return (await axios.get(url.href)).data;
 *   } catch (_error) {
 *     return null;
 *   }
 * }
 *
 * const cachedAxios = neshClassicCache(getViaAxios);
 *
 * export default async function handler(request, response) {
 *   if (request.method !== 'GET') {
 *     return response.status(405).send(null);
 *   }
 *
 *   const revalidate = 5;
 *
 *   const url = new URL('https://api.example.com/data.json');
 *
 *   // Add tags to be able to revalidate the cache
 *   const data = await cachedAxios({ revalidate, tags: [url.pathname], responseContext: response }, url);
 *
 *   if (!data) {
 *     response.status(404).send('Not found');
 *
 *     return;
 *   }
 *
 *   response.json(data);
 * }
 * ```
 *
 * @remarks
 * - This function is intended to be used in a Next.js Pages directory.
 *
 * @since 1.8.0
 */
export function neshClassicCache<Arguments extends unknown[], Result extends Promise<unknown>>(
    callback: Callback<Arguments, Result>,
    commonOptions?: CommonNeshClassicCacheOptions<Arguments, Result>,
) {
    if (commonOptions?.resultSerializer && !commonOptions?.resultDeserializer) {
        throw new Error('neshClassicCache: if you provide a resultSerializer, you must provide a resultDeserializer.');
    }

    if (commonOptions?.resultDeserializer && !commonOptions?.resultSerializer) {
        throw new Error('neshClassicCache: if you provide a resultDeserializer, you must provide a resultSerializer.');
    }

    const commonRevalidate = commonOptions?.revalidate ?? false;
    const commonArgumentsSerializer = commonOptions?.argumentsSerializer ?? serializeArguments;
    const commonResultSerializer = commonOptions?.resultSerializer ?? serializeResult;
    const commonResultDeserializer = commonOptions?.resultDeserializer ?? deserializeResult;

    async function cachedCallback(
        options: NeshClassicCacheOptions<Arguments, Result>,
        ...args: Arguments
    ): Promise<Result | null> {
        const store = staticGenerationAsyncStorage.getStore();

        assert(!store?.incrementalCache, 'neshClassicCache must be used in a Next.js Pages directory.');

        const cacheHandler = globalThis?.__incrementalCache?.cacheHandler as
            | InstanceType<typeof CacheHandler>
            | undefined;

        assert(cacheHandler, 'neshClassicCache must be used in a Next.js Pages directory.');

        const {
            responseContext,
            tags = [],
            revalidate = commonRevalidate,
            cacheKey,
            argumentsSerializer = commonArgumentsSerializer,
            resultDeserializer = commonResultDeserializer,
            resultSerializer = commonResultSerializer,
        } = options ?? {};

        assert(
            revalidate === false || (revalidate > 0 && Number.isInteger(revalidate)),
            'neshClassicCache: revalidate must be a positive integer or false.',
        );

        responseContext?.setHeader('Cache-Control', `public, s-maxage=${revalidate}, stale-while-revalidate`);

        const uniqueTags = new Set<string>();

        for (const tag of tags) {
            if (typeof tag === 'string') {
                uniqueTags.add(tag);
            } else {
                console.warn(`neshClassicCache: Invalid tag: ${tag}. Skipping it. Expected a string.`);
            }
        }

        const allTags = Array.from(uniqueTags);

        const key = hashCacheKey(`nesh-classic-cache-${cacheKey ?? argumentsSerializer(args)}`);

        const cacheData = await cacheHandler.get(key, {
            revalidate,
            tags: allTags,
            kindHint: 'fetch',
            fetchUrl: 'neshClassicCache',
        });

        if (
            cacheData?.value?.kind === 'FETCH' &&
            cacheData.lifespan &&
            cacheData.lifespan.staleAt > Date.now() / 1000
        ) {
            return resultDeserializer(cacheData.value.data.body);
        }

        const data: Result = await callback(...args);

        cacheHandler.set(
            key,
            {
                kind: 'FETCH',
                data: {
                    body: resultSerializer(data),
                    headers: {},
                    url: 'neshClassicCache',
                },
                revalidate: revalidate || TIME_ONE_YEAR,
            },
            { revalidate, tags, fetchCache: true, fetchUrl: 'neshClassicCache' },
        );

        if (
            cacheData?.value?.kind === 'FETCH' &&
            cacheData?.lifespan &&
            cacheData.lifespan.expireAt > Date.now() / 1000
        ) {
            return resultDeserializer(cacheData.value.data.body);
        }

        return data;
    }

    return cachedCallback;
}
