import type { CacheHandlerValue, Handler } from '../cache-handler';
import type { CreateRedisStringsHandlerOptions } from '../common-types';

import { REVALIDATED_TAGS_KEY } from '../constants';
import { getTimeoutRedisCommandOptions } from '../helpers/get-timeout-redis-command-options';
import { isImplicitTag } from '../helpers/is-implicit-tag';

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
 *
 * @since 1.0.0
 */
export default function createHandler({
    client,
    keyPrefix = '',
    sharedTagsKey = '__sharedTags__',
    timeoutMs = 5000,
    keyExpirationStrategy = 'EXPIREAT',
}: CreateRedisStringsHandlerOptions): Handler {
    function assertClientIsReady(): void {
        if (!client.isReady) {
            throw new Error('Redis client is not ready yet or connection is lost. Keep trying...');
        }
    }

    const revalidatedTagsKey = keyPrefix + REVALIDATED_TAGS_KEY;

    return {
        name: 'redis-strings',
        async get(key, { implicitTags }) {
            assertClientIsReady();

            const result = await client.get(getTimeoutRedisCommandOptions(timeoutMs), keyPrefix + key);

            if (!result) {
                return null;
            }

            const cacheValue = JSON.parse(result) as CacheHandlerValue | null;

            if (!cacheValue) {
                return null;
            }

            const combinedTags = new Set([...cacheValue.tags, ...implicitTags]);

            if (combinedTags.size === 0) {
                return cacheValue;
            }

            const revalidationTimes = await client.hmGet(
                getTimeoutRedisCommandOptions(timeoutMs),
                revalidatedTagsKey,
                Array.from(combinedTags),
            );

            for (const timeString of revalidationTimes) {
                if (timeString && Number.parseInt(timeString, 10) > cacheValue.lastModified) {
                    await client.unlink(getTimeoutRedisCommandOptions(timeoutMs), keyPrefix + key);

                    return null;
                }
            }

            return cacheValue;
        },
        async set(key, cacheHandlerValue) {
            assertClientIsReady();

            const options = getTimeoutRedisCommandOptions(timeoutMs);

            let setOperation: Promise<string | null>;

            let expireOperation: Promise<boolean> | undefined;

            switch (keyExpirationStrategy) {
                case 'EXAT': {
                    setOperation = client.set(
                        options,
                        keyPrefix + key,
                        JSON.stringify(cacheHandlerValue),
                        typeof cacheHandlerValue.lifespan?.expireAt === 'number'
                            ? {
                                  EXAT: cacheHandlerValue.lifespan.expireAt,
                              }
                            : undefined,
                    );
                    break;
                }
                case 'EXPIREAT': {
                    setOperation = client.set(options, keyPrefix + key, JSON.stringify(cacheHandlerValue));

                    expireOperation = cacheHandlerValue.lifespan
                        ? client.expireAt(options, keyPrefix + key, cacheHandlerValue.lifespan.expireAt)
                        : undefined;
                    break;
                }
            }

            const setTagsOperation = cacheHandlerValue.tags.length
                ? client.hSet(options, keyPrefix + sharedTagsKey, key, JSON.stringify(cacheHandlerValue.tags))
                : undefined;

            await Promise.all([setOperation, expireOperation, setTagsOperation]);
        },
        async revalidateTag(tag) {
            assertClientIsReady();

            // If the tag is an implicit tag, we need to mark it as revalidated.
            // The revalidation process is done by the CacheHandler class on the next get operation.
            if (isImplicitTag(tag)) {
                await client.hSet(getTimeoutRedisCommandOptions(timeoutMs), revalidatedTagsKey, tag, Date.now());
            }

            const tagsMap: Map<string, string[]> = new Map();

            let currentCursor = 0;

            do {
                assertClientIsReady();

                const options = getTimeoutRedisCommandOptions(timeoutMs);

                const { cursor, tuples } = await client.hScan(options, keyPrefix + sharedTagsKey, currentCursor, {
                    COUNT: 100,
                });

                currentCursor = cursor;

                for (const { field, value } of tuples) {
                    tagsMap.set(field, JSON.parse(value));
                }
            } while (currentCursor !== 0);

            const keysToDelete: string[] = [];

            const tagsToDelete: string[] = [];

            for (const [key, tags] of tagsMap) {
                if (tags.includes(tag)) {
                    keysToDelete.push(keyPrefix + key);
                    tagsToDelete.push(key);
                }
            }

            if (keysToDelete.length === 0) {
                return;
            }

            const options = getTimeoutRedisCommandOptions(timeoutMs);

            const deleteKeysOperation = client.unlink(options, keysToDelete);

            const updateTagsOperation = client.hDel(options, keyPrefix + sharedTagsKey, tagsToDelete);

            await Promise.all([deleteKeysOperation, updateTagsOperation]);
        },
    };
}
