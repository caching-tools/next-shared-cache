import { SchemaFieldTypes, type RedisClientType } from 'redis';

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
export default async function createCache<T extends RedisClientType>({
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

    function sanitizeTag(str: string) {
        return str.replace(/[^a-zA-Z0-9]/gi, '_');
    }

    assertClientIsReady();

    try {
        await client.ft.create(
            'idx:tags',
            {
                '$.tags': { type: SchemaFieldTypes.TEXT, AS: 'tag' },
            },
            {
                ON: 'JSON',
            },
        );
    } catch (e) {
        // Index already exists
    }

    return {
        name: 'redis-stack',
        async get(key) {
            assertClientIsReady();

            const cacheValue = (await client.json.get(
                getTimeoutRedisCommandOptions(timeoutMs),
                keyPrefix + key,
            )) as CacheHandlerValue | null;

            if (cacheValue?.value?.kind === 'ROUTE') {
                cacheValue.value.body = Buffer.from(cacheValue.value.body as unknown as string, 'base64');
            }

            return cacheValue;
        },
        async set(key, cacheHandlerValue) {
            assertClientIsReady();

            let preparedCacheValue = cacheHandlerValue;

            if (cacheHandlerValue.value?.kind === 'ROUTE') {
                preparedCacheValue = structuredClone(cacheHandlerValue);
                // @ts-expect-error -- object must have the same shape as cacheValue
                preparedCacheValue.value.body = cacheHandlerValue.value.body.toString('base64') as unknown as Buffer;
            }

            preparedCacheValue.tags = preparedCacheValue.tags.map((tag) => {
                return sanitizeTag(sharedTagsKey + tag);
            });

            const options = getTimeoutRedisCommandOptions(timeoutMs);

            const setCacheValue = client.json.set(
                options,
                keyPrefix + key,
                '.',
                preparedCacheValue as unknown as RedisJSON,
            );

            const expireCacheValue = cacheHandlerValue.lifespan
                ? client.expireAt(options, keyPrefix + key, cacheHandlerValue.lifespan.expireAt)
                : undefined;

            await Promise.all([setCacheValue, expireCacheValue]);
        },
        async revalidateTag(tag) {
            assertClientIsReady();

            const options = getTimeoutRedisCommandOptions(timeoutMs);

            const query = await client.ft.search('idx:tags', `@tag:(${sanitizeTag(sharedTagsKey + tag)})`);

            const keysToDelete = query.documents.map((doc) => doc.id);

            const deleteCacheOperation = client.del(options, keysToDelete);

            await Promise.all([deleteCacheOperation]);
        },
    };
}
