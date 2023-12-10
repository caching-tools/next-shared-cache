/* eslint-disable import/no-default-export -- use default here */
/* eslint-disable camelcase -- unstable__* */
/* eslint-disable no-console -- log errors */
import { reviveFromBase64Representation, replaceJsonWithBase64 } from '@neshca/json-replacer-reviver';
import type { RedisClientType, RedisClusterType } from 'redis';
import type { RevalidatedTags, CacheHandlerValue, Cache } from '../cache-handler';
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
export default function createCache<T extends RedisClientType | RedisClusterType>({
    client,
    keyPrefix = '',
    revalidatedTagsKey = '__sharedRevalidatedTags__',
    useTtl = false,
    unstable__logErrors,
}: RedisCacheHandlerOptions<T>): Cache {
    return {
        async get(key) {
            try {
                const result = (await client.get(keyPrefix + key)) ?? null;

                if (!result) {
                    return null;
                }

                // use reviveFromBase64Representation to restore binary data from Base64
                return JSON.parse(result, reviveFromBase64Representation) as CacheHandlerValue | null;
            } catch (error) {
                if (unstable__logErrors) {
                    console.error('cache.get', error);
                }

                return null;
            }
        },
        async set(key, value, ttl) {
            try {
                // use replaceJsonWithBase64 to store binary data in Base64 and save space
                await client.set(
                    keyPrefix + key,
                    JSON.stringify(value, replaceJsonWithBase64),
                    useTtl && typeof ttl === 'number' ? { EX: ttl } : undefined,
                );
            } catch (error) {
                if (unstable__logErrors) {
                    console.error('cache.set', error);
                }
            }
        },
        async getRevalidatedTags() {
            try {
                const sharedRevalidatedTags = await client.hGetAll(keyPrefix + revalidatedTagsKey);

                const entries = Object.entries(sharedRevalidatedTags);

                const revalidatedTags = entries.reduce<RevalidatedTags>((acc, [tag, revalidatedAt]) => {
                    acc[tag] = Number(revalidatedAt);

                    return acc;
                }, {});

                return revalidatedTags;
            } catch (error) {
                if (unstable__logErrors) {
                    console.error('cache.getRevalidatedTags', error);
                }
            }
        },
        async revalidateTag(tag, revalidatedAt) {
            try {
                await client.hSet(keyPrefix + revalidatedTagsKey, {
                    [tag]: revalidatedAt,
                });
            } catch (error) {
                if (unstable__logErrors) {
                    console.error('cache.revalidateTag', error);
                }
            }
        },
    };
}
