/* eslint-disable import/no-default-export -- use default here */
import type { RedisClientType } from 'redis';
import type { RevalidatedTags, CacheHandlerValue, Cache } from '../cache-handler';
import type { RedisJSON } from '../common-types';
import { withTimeout } from '../with-timeout';

/**
 * The configuration options for the Redis Handler
 */
export type RedisCacheHandlerOptions<T> = {
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
     * Optional. Enables ttl support. Defaults to `false`.
     *
     * @remarks
     * - **File System Cache**: Ensure that the file system cache is disabled
     * by setting `useFileSystem: false` in your cache handler configuration.
     * This is crucial for the TTL feature to work correctly.
     * If the file system cache is enabled,
     * the cache entries will HIT from the file system cache when expired in Redis.
     * - **Pages Directory Limitation**: Due to a known issue in Next.js,
     * disabling the file system cache may not function properly within the Pages directory.
     * It is recommended to use TTL primarily in the App directory.
     * More details on this limitation can be found in the file system cache configuration documentation.
     */
    useTtl?: boolean;
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

    await withTimeout(setInitialRevalidatedTags, timeoutMs);

    return {
        name: 'redis-stack',
        async get(key) {
            assertClientIsReady();

            const getCacheValue = client.json.get(keyPrefix + key);

            const cacheValue = ((await withTimeout(getCacheValue, timeoutMs)) ?? null) as CacheHandlerValue | null;

            if (cacheValue?.value?.kind === 'ROUTE') {
                cacheValue.value.body = Buffer.from(cacheValue.value.body as unknown as string, 'base64');
            }

            return cacheValue;
        },
        async set(key, cacheValue, ttl) {
            assertClientIsReady();

            let preparedCacheValue = cacheValue;

            if (cacheValue.value?.kind === 'ROUTE') {
                preparedCacheValue = structuredClone(cacheValue);
                // @ts-expect-error -- object must have the same shape as cacheValue
                preparedCacheValue.value.body = cacheValue.value.body.toString('base64') as unknown as Buffer;
            }

            const setCacheValue = client.json.set(keyPrefix + key, '.', preparedCacheValue as unknown as RedisJSON);

            await withTimeout(setCacheValue, timeoutMs);

            if (useTtl && typeof ttl === 'number') {
                const setExpire = client.expire(keyPrefix + key, ttl);

                await withTimeout(setExpire, timeoutMs);
            }
        },
        async getRevalidatedTags() {
            assertClientIsReady();

            const getRevalidatedTags = client.json.get(keyPrefix + revalidatedTagsKey);

            const sharedRevalidatedTags = ((await withTimeout(getRevalidatedTags, timeoutMs)) ?? undefined) as
                | RevalidatedTags
                | undefined;

            return sharedRevalidatedTags;
        },
        async revalidateTag(tag, revalidatedAt) {
            assertClientIsReady();

            const setRevalidatedTags = client.json.set(keyPrefix + revalidatedTagsKey, `.${tag}`, revalidatedAt);

            await withTimeout(setRevalidatedTags, timeoutMs);
        },
    };
}
