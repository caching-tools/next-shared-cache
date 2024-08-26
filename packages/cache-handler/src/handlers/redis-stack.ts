import { ErrorReply, SchemaFieldTypes } from 'redis';

import { randomBytes } from 'node:crypto';
import type { CacheHandlerValue, Handler } from '../cache-handler';
import type { CreateRedisStackHandlerOptions, RedisJSON } from '../common-types';
import { REVALIDATED_TAGS_KEY, TIME_ONE_YEAR } from '../constants';
import { getTimeoutRedisCommandOptions } from '../helpers/get-timeout-redis-command-options';
import { isImplicitTag } from '../helpers/is-implicit-tag';

export type { CreateRedisStackHandlerOptions };

/**
 * Creates a Handler for handling cache operations using Redis JSON.
 *
 * This function initializes a Handler for managing cache operations using Redis.
 * It supports Redis Client. The resulting Handler includes
 * methods to get, set, and manage cache values fot on-demand revalidation.
 *
 * @param options - The configuration options for the Redis Stack Handler. See {@link CreateRedisStackHandlerOptions}.
 *
 * @returns An object representing the cache, with methods for cache operations.
 *
 * @example
 * ```js
 * const client = createClient(clientOptions);
 *
 * const redisHandler = createHandler({
 *   client,
 *   keyPrefix: 'myApp:',
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
    timeoutMs = 5000,
    revalidateTagQuerySize = 100,
}: CreateRedisStackHandlerOptions): Handler {
    function assertClientIsReady(): void {
        if (!client.isReady) {
            throw new Error('Redis client is not ready');
        }
    }

    function sanitizeTag(str: string) {
        return str.replace(/[^a-zA-Z0-9]/gi, '_');
    }

    const indexName = `idx:tags-${randomBytes(32).toString('hex')}`;

    async function createIndexIfNotExists(): Promise<void> {
        try {
            await client.ft.create(
                indexName,
                {
                    '$.tags': { type: SchemaFieldTypes.TEXT, AS: 'tag' },
                },
                {
                    ON: 'JSON',
                    TEMPORARY: TIME_ONE_YEAR,
                },
            );
        } catch (error) {
            if (error instanceof ErrorReply && error.message === 'Index already exists') {
                return;
            }

            throw error;
        }
    }

    const revalidatedTagsKey = keyPrefix + REVALIDATED_TAGS_KEY;

    return {
        name: 'redis-stack',
        async get(key, { implicitTags }) {
            assertClientIsReady();

            const cacheValue = (await client.json.get(
                getTimeoutRedisCommandOptions(timeoutMs),
                keyPrefix + key,
            )) as CacheHandlerValue | null;

            if (!cacheValue) {
                return null;
            }

            const sanitizedImplicitTags = implicitTags.map(sanitizeTag);

            const combinedTags = new Set([...cacheValue.tags, ...sanitizedImplicitTags]);

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

            await createIndexIfNotExists();

            const sanitizedTag = sanitizeTag(tag);

            // If the tag is an implicit tag, we need to mark it as revalidated.
            // The revalidation process is done by the CacheHandler class on the next get operation.
            if (isImplicitTag(tag)) {
                await client.hSet(
                    getTimeoutRedisCommandOptions(timeoutMs),
                    revalidatedTagsKey,
                    sanitizedTag,
                    Date.now(),
                );
            }

            let from = 0;

            const keysToDelete: string[] = [];

            while (true) {
                const { documents: documentIds } = await client.ft.searchNoContent(
                    getTimeoutRedisCommandOptions(timeoutMs),
                    indexName,
                    `@tag:(${sanitizedTag})`,
                    {
                        LIMIT: { from, size: revalidateTagQuerySize },
                        TIMEOUT: timeoutMs,
                    },
                );

                for (const id of documentIds) {
                    keysToDelete.push(id);
                }

                if (documentIds.length < revalidateTagQuerySize) {
                    break;
                }

                from += revalidateTagQuerySize;
            }

            if (keysToDelete.length === 0) {
                return;
            }

            const options = getTimeoutRedisCommandOptions(timeoutMs);

            await client.unlink(options, keysToDelete);
        },
        async delete(key) {
            await client.unlink(getTimeoutRedisCommandOptions(timeoutMs), key);
        },
    };
}
