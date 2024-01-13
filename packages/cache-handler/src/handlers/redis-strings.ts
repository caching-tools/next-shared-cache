/* eslint-disable import/no-default-export -- use default here */
import { replaceJsonWithBase64, reviveFromBase64Representation } from '@neshca/json-replacer-reviver';
import type { RedisClientType } from 'redis';
import type { Cache, CacheHandlerValue, RevalidatedTags } from '../cache-handler';
import { calculateEvictionDelay } from '../helpers/calculate-eviction-delay';
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
export default function createCache<T extends RedisClientType>({
    client,
    keyPrefix = '',
    revalidatedTagsKey = '__sharedRevalidatedTags__',
    useTtl = false,
    timeoutMs = 5000,
}: RedisCacheHandlerOptions<T>): Cache {
    function assertClientIsReady(): void {
        if (!client.isReady) {
            throw new Error('Redis client is not ready yet or connection is lost. Keep trying...');
        }
    }

    return {
        name: 'redis-strings',
        async get(key) {
            assertClientIsReady();

            const getOperation = client.get(getTimeoutRedisCommandOptions(timeoutMs), keyPrefix + key);

            const result = await getOperation;

            if (!result) {
                return null;
            }

            // use reviveFromBase64Representation to restore binary data from Base64
            return JSON.parse(result, reviveFromBase64Representation) as CacheHandlerValue | null;
        },
        async set(key, value, maxAgeSeconds) {
            assertClientIsReady();

            const evictionDelay = calculateEvictionDelay(maxAgeSeconds, useTtl);

            // use replaceJsonWithBase64 to store binary data in Base64 and save space
            await client.set(
                getTimeoutRedisCommandOptions(timeoutMs),
                keyPrefix + key,
                JSON.stringify(value, replaceJsonWithBase64),
                evictionDelay ? { EX: evictionDelay } : undefined,
            );
        },
        async getRevalidatedTags() {
            assertClientIsReady();

            const sharedRevalidatedTags = await client.hGetAll(
                getTimeoutRedisCommandOptions(timeoutMs),
                keyPrefix + revalidatedTagsKey,
            );

            const entries = Object.entries(sharedRevalidatedTags);

            const revalidatedTags = entries.reduce<RevalidatedTags>((acc, [tag, revalidatedAt]) => {
                acc[tag] = Number(revalidatedAt);

                return acc;
            }, {});

            return revalidatedTags;
        },
        async revalidateTag(tag, revalidatedAt) {
            assertClientIsReady();

            await client.hSet(getTimeoutRedisCommandOptions(timeoutMs), keyPrefix + revalidatedTagsKey, {
                [tag]: revalidatedAt,
            });
        },
    };
}
