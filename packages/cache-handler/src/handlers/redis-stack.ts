import { SchemaFieldTypes } from 'redis';

import type { CacheHandlerValue, Handler } from '../cache-handler';
import type { CreateRedisStackHandlerOptions, RedisJSON } from '../common-types';
import { getTimeoutRedisCommandOptions } from '../helpers/get-timeout-redis-command-options';

export type { CreateRedisStackHandlerOptions };

/**
 * Creates a Handler using Redis client.
 *
 * This function initializes a Handler for managing cache operations using Redis.
 * It supports Redis Client. The handler includes
 * methods to get, set, and manage cache values and revalidated tags.
 *
 * @param options - The configuration options for the Redis Stack Handler. See {@link CreateRedisStackHandlerOptions}.
 *
 * @returns A promise that resolves to object representing the cache, with methods for cache operations.
 *
 * @example
 * ```js
 * const redisClient = createRedisClient(...);
 * const handler = await createHandler({
 *   client: redisClient,
 *   keyPrefix: 'myApp:',
 * });
 * ```
 *
 * @remarks
 * - the `get` method retrieves a value from the cache, automatically converting `Buffer` types when necessary.
 * - the `set` method allows setting a value in the cache.
 * - the `revalidateTag` methods are used for handling tag-based cache revalidation.
 */
export default async function createHandler({
    client,
    keyPrefix = '',
    timeoutMs = 5000,
}: CreateRedisStackHandlerOptions): Promise<Handler> {
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
    } catch (_e) {
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

            return cacheValue;
        },
        async set(key, cacheHandlerValue) {
            assertClientIsReady();

            cacheHandlerValue.tags = cacheHandlerValue.tags.map(sanitizeTag);

            const options = getTimeoutRedisCommandOptions(timeoutMs);

            const setCacheValue = client.json.set(
                options,
                keyPrefix + key,
                '.',
                cacheHandlerValue as unknown as RedisJSON,
            );

            const expireCacheValue = cacheHandlerValue.lifespan
                ? client.expireAt(options, keyPrefix + key, cacheHandlerValue.lifespan.expireAt)
                : undefined;

            await Promise.all([setCacheValue, expireCacheValue]);
        },
        async revalidateTag(tag) {
            assertClientIsReady();

            const query = await client.ft.search('idx:tags', `@tag:(${sanitizeTag(tag)})`);

            const keysToDelete = query.documents.map((document) => document.id);

            if (keysToDelete.length === 0) {
                return;
            }

            const options = getTimeoutRedisCommandOptions(timeoutMs);

            await client.del(options, keysToDelete);
        },
    };
}
