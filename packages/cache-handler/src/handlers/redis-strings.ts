// import type { RedisClientType } from 'redis';

import type { CacheHandlerValue, Handler } from '../cache-handler';
import type { CreateRedisStringsHandlerOptions } from '../common-types';

import { getTimeoutRedisCommandOptions } from '../helpers/get-timeout-redis-command-options';

export type { CreateRedisStringsHandlerOptions };

/**
 * Creates a Handler using Redis client.
 *
 * This function initializes a Handler for managing cache operations using Redis.
 * It supports both Redis Client and Redis Cluster types. The handler includes
 * methods to get, set, and manage cache values and revalidated tags.
 *
 * @param options - The configuration options for the Redis Handler. See {@link CreateRedisStringsHandlerOptions}.
 *
 * @returns An object representing the cache, with methods for cache operations.
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
export default function createHandler({
    client,
    keyPrefix = '',
    sharedTagsKey = '__sharedTags__',
    timeoutMs = 5000,
}: CreateRedisStringsHandlerOptions): Handler {
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

            const setOperation = client.set(options, keyPrefix + key, JSON.stringify(cacheHandlerValue));

            const expireOperation = cacheHandlerValue.lifespan
                ? client.expireAt(options, keyPrefix + key, cacheHandlerValue.lifespan.expireAt)
                : undefined;

            const setTagsOperation = cacheHandlerValue.tags.length
                ? client.hSet(options, keyPrefix + sharedTagsKey, {
                      [key]: JSON.stringify(cacheHandlerValue.tags),
                  })
                : undefined;

            await Promise.all([setOperation, expireOperation, setTagsOperation]);
        },
        async revalidateTag(tag) {
            assertClientIsReady();

            const remoteTags: Record<string, string> = await client.hGetAll(
                getTimeoutRedisCommandOptions(timeoutMs),
                keyPrefix + sharedTagsKey,
            );

            const tagsMap = new Map(Object.entries(remoteTags));

            const keysToDelete = [];

            const tagsToDelete = [];

            for (const [key, tagsString] of tagsMap) {
                const tags = JSON.parse(tagsString);

                if (tags.includes(tag)) {
                    keysToDelete.push(keyPrefix + key);
                    tagsToDelete.push(key);
                }
            }

            if (keysToDelete.length === 0) {
                return;
            }

            const options = getTimeoutRedisCommandOptions(timeoutMs);

            const deleteKeysOperation = client.del(options, keysToDelete);

            const updateTagsOperation = client.hDel(options, keyPrefix + sharedTagsKey, tagsToDelete);

            await Promise.all([deleteKeysOperation, updateTagsOperation]);
        },
    };
}
