/* eslint-disable import/no-default-export -- use default here */
import type { RedisClientType } from 'redis';
import type { RevalidatedTags, CacheHandlerValue, Cache } from '../cache-handler';
import type { RedisJSON, UseTtlOptions } from '../common-types';
import { promiseWithTimeout } from '../helpers/promise-with-timeout';
import { calculateEvictionDelay } from '../helpers/calculate-eviction-delay';

/**
 * The configuration options for the Redis Handler
 */
export type RedisCacheHandlerOptions<T> = UseTtlOptions & {
    /**
     * The Redis client instance.
     */
    client: T;
    /**
     * Optional. Prefix for all keys, useful for namespacing. Defaults to an empty string.
     */
    keyPrefix?: string;
    /**
     * Optional. Key to store the `RevalidatedTags`. Defaults to `__sharedRevalidatedTags__`.
     */
    revalidatedTagsKey?: string;
    /**
     * Timeout in milliseconds for Redis operations.
     */
    timeoutMs?: number;
};

/**
 * Creates a Handler using Redis client.
 *
 * This function initializes a Handler for managing cache operations using Redis.
 * It supports Redis Client. The handler includes
 * methods to get, set, and manage cache values and revalidated tags.
 *
 * @param options - The configuration options for the Redis Handler. See {@link RedisCacheHandlerOptions}.
 *
 * @returns A promise that resolves to object representing the cache, with methods for cache operations.
 *
 * @example
 * ```js
 * const redisClient = createRedisClient(...);
 * const cache = await createCache({
 *   client: redisClient,
 *   keyPrefix: 'myApp:',
 *   revalidatedTagsKey: 'myRevalidatedTags'
 * });
 * ```
 *
 * @remarks
 * The `get` method retrieves a value from the cache, automatically converting `Buffer` types when necessary.
 *
 * The `set` method allows setting a value in the cache.
 *
 * The `getRevalidatedTags` and `revalidateTag` methods are used for handling tag-based cache revalidation.
 */
export default async function createCache<T extends RedisClientType>({
    client,
    keyPrefix = '',
    revalidatedTagsKey = '__sharedRevalidatedTags__',
    useTtl = false,
    timeoutMs,
}: RedisCacheHandlerOptions<T>): Promise<Cache> {
    function assertClientIsReady(): void {
        if (!client.isReady) {
            throw new Error('Redis client is not ready');
        }
    }

    assertClientIsReady();

    const setInitialRevalidatedTags = client.json.set(
        keyPrefix + revalidatedTagsKey,
        '.',
        {},
        {
            NX: true,
        },
    );

    await promiseWithTimeout(setInitialRevalidatedTags, timeoutMs);

    return {
        name: 'redis-stack',
        async get(key) {
            assertClientIsReady();

            const getCacheValue = client.json.get(keyPrefix + key);

            const cacheValue = ((await promiseWithTimeout(getCacheValue, timeoutMs)) ??
                null) as CacheHandlerValue | null;

            if (cacheValue?.value?.kind === 'ROUTE') {
                cacheValue.value.body = Buffer.from(cacheValue.value.body as unknown as string, 'base64');
            }

            return cacheValue;
        },
        async set(key, cacheValue, maxAgeSeconds) {
            assertClientIsReady();

            let preparedCacheValue = cacheValue;

            if (cacheValue.value?.kind === 'ROUTE') {
                preparedCacheValue = structuredClone(cacheValue);
                // @ts-expect-error -- object must have the same shape as cacheValue
                preparedCacheValue.value.body = cacheValue.value.body.toString('base64') as unknown as Buffer;
            }

            const setCacheValue = client.json.set(keyPrefix + key, '.', preparedCacheValue as unknown as RedisJSON);

            await promiseWithTimeout(setCacheValue, timeoutMs);

            if (typeof maxAgeSeconds !== 'number') {
                return;
            }

            const evictionDelay = calculateEvictionDelay(maxAgeSeconds, useTtl);

            if (!evictionDelay) {
                return;
            }

            const setExpire = client.expire(keyPrefix + key, evictionDelay);

            await promiseWithTimeout(setExpire, timeoutMs);
        },
        async getRevalidatedTags() {
            assertClientIsReady();

            const getRevalidatedTags = client.json.get(keyPrefix + revalidatedTagsKey);

            const sharedRevalidatedTags = ((await promiseWithTimeout(getRevalidatedTags, timeoutMs)) ?? undefined) as
                | RevalidatedTags
                | undefined;

            return sharedRevalidatedTags;
        },
        async revalidateTag(tag, revalidatedAt) {
            assertClientIsReady();

            const setRevalidatedTags = client.json.set(keyPrefix + revalidatedTagsKey, `.${tag}`, revalidatedAt);

            await promiseWithTimeout(setRevalidatedTags, timeoutMs);
        },
    };
}
