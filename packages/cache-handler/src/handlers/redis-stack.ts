import { SchemaFieldTypes, type RedisClientType } from 'redis';

import type { Cache, CacheHandlerValue, RevalidatedTags } from '../cache-handler';
import type { RedisJSON, UseTtlOptions } from '../common-types';
import { calculateEvictionDelay } from '../helpers/calculate-eviction-delay';
import { getTimeoutRedisCommandOptions } from '../helpers/get-timeout-redis-command-options';

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
    timeoutMs = 5000,
}: RedisCacheHandlerOptions<T>): Promise<Cache> {
    function assertClientIsReady(): void {
        if (!client.isReady) {
            throw new Error('Redis client is not ready');
        }
    }

    function sanitizeTag(str: string) {
        return str.replace(/[^a-zA-Z0-9]/gi, '_');
    }

    assertClientIsReady();

    await client.json.set(
        getTimeoutRedisCommandOptions(timeoutMs),
        keyPrefix + revalidatedTagsKey,
        '.',
        {},
        {
            NX: true,
        },
    );

    try {
        await client.ft.create(
            'idx:tags',
            {
                '$value.tags': { type: SchemaFieldTypes.TEXT, AS: 'tag' },
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
        async set(key, cacheValue, maxAgeSeconds) {
            assertClientIsReady();

            let preparedCacheValue = cacheValue;

            if (cacheValue.value?.kind === 'ROUTE') {
                preparedCacheValue = structuredClone(cacheValue);
                // @ts-expect-error -- object must have the same shape as cacheValue
                preparedCacheValue.value.body = cacheValue.value.body.toString('base64') as unknown as Buffer;
            }

            if (preparedCacheValue.value?.kind === 'FETCH') {
                preparedCacheValue.value.tags = preparedCacheValue.value.tags?.map(sanitizeTag);
            }

            const options = getTimeoutRedisCommandOptions(timeoutMs);

            const setCacheValue = client.json.set(
                options,
                keyPrefix + key,
                '.',
                preparedCacheValue as unknown as RedisJSON,
            );

            const commands: Promise<unknown>[] = [setCacheValue];

            const evictionDelay = calculateEvictionDelay(maxAgeSeconds, useTtl);

            if (evictionDelay) {
                commands.push(client.expire(options, keyPrefix + key, evictionDelay));
            }

            await Promise.allSettled(commands);
        },
        async getRevalidatedTags() {
            assertClientIsReady();

            const sharedRevalidatedTags = (await client.json.get(
                getTimeoutRedisCommandOptions(timeoutMs),
                keyPrefix + revalidatedTagsKey,
            )) as RevalidatedTags | undefined;

            return sharedRevalidatedTags;
        },
        async revalidateTag(tag, revalidatedAt) {
            assertClientIsReady();

            let keys = await client.ft.search('idx:tags', `@tag:(${sanitizeTag(tag)})`);
            for (let doc of keys.documents) {
                await client.del(doc.id);
            }

            await client.json.set(
                getTimeoutRedisCommandOptions(timeoutMs),
                keyPrefix + revalidatedTagsKey,
                `.${sanitizeTag(tag)}`,
                revalidatedAt,
            );
        },
    };
}
