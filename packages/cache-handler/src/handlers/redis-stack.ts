/* eslint-disable import/no-default-export -- use default here */
/* eslint-disable camelcase -- unstable__* */
/* eslint-disable no-console -- log errors */
import type { RedisClientType, RedisClusterType } from 'redis';
import type { RevalidatedTags, CacheHandlerValue, Cache } from '../cache-handler';
import type { CacheHandlerOptions, RedisJSON } from '../common-types';

/**
 * The configuration options for the Redis Handler
 */
export type RedisCacheHandlerOptions<T> = CacheHandlerOptions & {
    /**
     * The Redis client instance, either `RedisClient` or `RedisCluster`.
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
};

/**
 * Creates a Handler using Redis client.
 *
 * This function initializes a Handler for managing cache operations using Redis.
 * It supports both Redis Client and Redis Cluster types. The handler includes
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
 *   revalidatedTagsKey: 'myRevalidatedTags',
 *   unstable__logErrors: true
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
export default async function createCache<T extends RedisClientType | RedisClusterType>({
    client,
    keyPrefix = '',
    revalidatedTagsKey = '__sharedRevalidatedTags__',
    useTtl = false,
    unstable__logErrors = false,
}: RedisCacheHandlerOptions<T>): Promise<Cache> {
    await client.json.set(
        keyPrefix + revalidatedTagsKey,
        '.',
        {},
        {
            NX: true,
        },
    );

    return {
        async get(key) {
            try {
                const cacheValue = ((await client.json.get(keyPrefix + key)) ?? null) as CacheHandlerValue | null;

                if (
                    cacheValue &&
                    cacheValue.value?.kind === 'ROUTE' &&
                    // @ts-expect-error -- after JSON parsing, body is a Json Buffer representation
                    cacheValue.value.body.type === 'Buffer'
                ) {
                    cacheValue.value.body = Buffer.from(cacheValue.value.body);
                }

                return cacheValue;
            } catch (error) {
                if (unstable__logErrors) {
                    console.error('cache.get', error);
                }

                return null;
            }
        },
        async set(key, value, ttl) {
            try {
                await client.json.set(keyPrefix + key, '.', value as unknown as RedisJSON);

                if (useTtl && typeof ttl === 'number') {
                    await client.expire(keyPrefix + key, ttl);
                }
            } catch (error) {
                if (unstable__logErrors) {
                    console.error('cache.set', error);
                }
            }
        },
        async getRevalidatedTags() {
            try {
                const sharedRevalidatedTags = ((await client.json.get(keyPrefix + revalidatedTagsKey)) ?? undefined) as
                    | RevalidatedTags
                    | undefined;

                return sharedRevalidatedTags;
            } catch (error) {
                if (unstable__logErrors) {
                    console.error('cache.getRevalidatedTags', error);
                }
            }
        },
        async revalidateTag(tag, revalidatedAt) {
            try {
                await client.json.set(keyPrefix + revalidatedTagsKey, `.${tag}`, revalidatedAt);
            } catch (error) {
                if (unstable__logErrors) {
                    console.error('cache.revalidateTag', error);
                }
            }
        },
    };
}
