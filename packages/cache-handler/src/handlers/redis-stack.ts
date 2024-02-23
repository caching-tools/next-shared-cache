import type { RedisClientType } from 'redis';

import type { CacheHandlerValue, Handler } from '../cache-handler';
import type { RedisJSON } from '../common-types';
import { getTimeoutRedisCommandOptions } from '../helpers/get-timeout-redis-command-options';

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
     * Optional. Key for storing cache tags. Defaults to `__sharedTags__`.
     */
    sharedTagsKey?: string;
    /**
     * Timeout in milliseconds for Redis operations. Defaults to 5000.
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
 * const cache = await createHandler({
 *   client: redisClient,
 *   keyPrefix: 'myApp:',
 *   sharedTagsKey: 'myTags'
 * });
 * ```
 *
 * @remarks
 * - the `get` method retrieves a value from the cache, automatically converting `Buffer` types when necessary.
 * - the `set` method allows setting a value in the cache.
 * - the `revalidateTag` methods are used for handling tag-based cache revalidation.
 */
export default async function createHandler<T extends RedisClientType>({
    client,
    keyPrefix = '',
    sharedTagsKey = '__sharedTags__',
    timeoutMs = 5000,
}: RedisCacheHandlerOptions<T>): Promise<Handler> {
    function assertClientIsReady(): void {
        if (!client.isReady) {
            throw new Error('Redis client is not ready');
        }
    }

    assertClientIsReady();

    await client.json.set(
        getTimeoutRedisCommandOptions(timeoutMs),
        `${keyPrefix}${sharedTagsKey}`,
        '.',
        {},
        {
            NX: true,
        },
    );

    return {
        name: 'redis-stack',
        async get(key) {
            assertClientIsReady();

            const cacheValue = (await client.json.get(
                getTimeoutRedisCommandOptions(timeoutMs),
                keyPrefix + key,
            )) as CacheHandlerValue | null;

            return cacheValue;
        },
        async set(key, cacheHandlerValue) {
            assertClientIsReady();

            const options = getTimeoutRedisCommandOptions(timeoutMs);

            const setTags = client.json.set(options, `${keyPrefix}${sharedTagsKey}`, `.${key}`, cacheHandlerValue.tags);

            const setCacheValue = client.json.set(
                options,
                keyPrefix + key,
                '.',
                cacheHandlerValue as unknown as RedisJSON,
            );

            const expireCacheValue = cacheHandlerValue.lifespan
                ? client.expireAt(options, keyPrefix + key, cacheHandlerValue.lifespan.expireAt)
                : undefined;

            await Promise.all([setCacheValue, expireCacheValue, setTags]);
        },
        async revalidateTag(tag) {
            assertClientIsReady();

            const options = getTimeoutRedisCommandOptions(timeoutMs);

            const remoteTagsMap = await client.json.get(options, `${keyPrefix}${sharedTagsKey}`);

            const tagMap = new Map(Object.entries(remoteTagsMap as Record<string, string[]>));

            const keysToDelete = [];

            for (const [key, tags] of tagMap) {
                if (tags.includes(tag)) {
                    keysToDelete.push(keyPrefix + key);
                    tagMap.delete(key);
                }
            }

            const deleteCacheOperation = client.del(options, keysToDelete);

            const setTagsOperation = client.json.set(
                options,
                `${keyPrefix}${sharedTagsKey}`,
                '.',
                Object.fromEntries(tagMap),
            );

            await Promise.all([deleteCacheOperation, setTagsOperation]);
        },
    };
}
