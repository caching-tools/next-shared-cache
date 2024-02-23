import type { RedisClientType } from 'redis';

import type { CacheHandlerValue, Handler } from '../cache-handler';
import { getTimeoutRedisCommandOptions } from '../helpers/get-timeout-redis-command-options';

import type { RedisCacheHandlerOptions } from './redis-stack';

/**
 * Creates a Handler using Redis client.
 *
 * This function initializes a Handler for managing cache operations using Redis.
 * It supports both Redis Client and Redis Cluster types. The handler includes
 * methods to get, set, and manage cache values and revalidated tags.
 *
 * @param options - The configuration options for the Redis Handler. See {@link RedisCacheHandlerOptions}.
 *
 * @returns An object representing the cache, with methods for cache operations.
 *
 * @example
 * ```js
 * const redisClient = createRedisClient(...);
 * const cache = await createCache({
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
export default function createCache<T extends RedisClientType>({
    client,
    keyPrefix = '',
    sharedTagsKey = '__sharedTags__',
    timeoutMs = 5000,
}: RedisCacheHandlerOptions<T>): Handler {
    function assertClientIsReady(): void {
        if (!client.isReady) {
            throw new Error('Redis client is not ready yet or connection is lost. Keep trying...');
        }
    }

    return {
        name: 'redis-strings',
        async get(key) {
            assertClientIsReady();

            const result = await client.get(getTimeoutRedisCommandOptions(timeoutMs), keyPrefix + key);

            if (!result) {
                return null;
            }

            return JSON.parse(result) as CacheHandlerValue | null;
        },
        async set(key, cacheHandlerValue) {
            assertClientIsReady();

            const options = getTimeoutRedisCommandOptions(timeoutMs);

            const setOperation = client.set(
                options,
                keyPrefix + key,
                // use replaceJsonWithBase64 to store binary data in Base64 and save space for ROUTE kind
                JSON.stringify(cacheHandlerValue),
            );

            const expireOperation = cacheHandlerValue.lifespan
                ? client.expireAt(options, keyPrefix + key, cacheHandlerValue.lifespan.expireAt)
                : undefined;

            const setTagsOperation = cacheHandlerValue.tags.length
                ? client.hSet(options, `${keyPrefix}${sharedTagsKey}`, {
                      [key]: cacheHandlerValue.tags.join(','),
                  })
                : undefined;

            await Promise.all([setOperation, expireOperation, setTagsOperation]);
        },
        async revalidateTag(tag) {
            assertClientIsReady();

            const remoteTags: Record<string, string> = await client.hGetAll(
                getTimeoutRedisCommandOptions(timeoutMs),
                `${keyPrefix}${sharedTagsKey}`,
            );

            const tagsMap = new Map(Object.entries(remoteTags));

            const keysToDelete = [];

            for (const [key, tagsString] of tagsMap) {
                const tags = tagsString.split(',');

                if (tags.includes(tag)) {
                    keysToDelete.push(keyPrefix + key);
                    tagsMap.delete(key);
                }
            }

            const options = getTimeoutRedisCommandOptions(timeoutMs);

            const deleteKeysOperation = client.del(options, keysToDelete);

            const setTagsOperation = client.hSet(options, `${keyPrefix}${sharedTagsKey}`, Object.fromEntries(tagsMap));

            await Promise.all([deleteKeysOperation, setTagsOperation]);
        },
    };
}
