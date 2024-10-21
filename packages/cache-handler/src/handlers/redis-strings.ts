import type { CacheHandlerValue, Handler } from '../cache-handler';
import type { CreateRedisStringsHandlerOptions } from '../common-types';

import { REVALIDATED_TAGS_KEY } from '../constants';
import { isImplicitTag } from '../helpers/is-implicit-tag';

export type { CreateRedisStringsHandlerOptions };

/**
 * Creates a Handler for handling cache operations using Redis strings.
 *
 * This function initializes a Handler for managing cache operations using Redis.
 * It supports Redis Client. The resulting Handler includes
 * methods to get, set, and manage cache values fot on-demand revalidation.
 *
 * @param options - The configuration options for the Redis Handler. See {@link CreateRedisStringsHandlerOptions}.
 *
 * @returns An object representing the cache, with methods for cache operations.
 *
 * @example
 * ```js
 * const client = createClient(clientOptions);
 *
 * const redisHandler = await createHandler({
 *   client,
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
    keyExpirationStrategy = 'EXAT',
    revalidateTagQuerySize = 100,
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

            const result = await client.withAbortSignal(AbortSignal.timeout(timeoutMs)).get(keyPrefix + key);

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

            const revalidationTimes = await client
                .withAbortSignal(AbortSignal.timeout(timeoutMs))
                .hmGet(revalidatedTagsKey, Array.from(combinedTags));

            for (const timeString of revalidationTimes) {
                if (timeString && Number.parseInt(timeString, 10) > cacheValue.lastModified) {
                    await client.withAbortSignal(AbortSignal.timeout(timeoutMs)).unlink(keyPrefix + key);

                    return null;
                }
            }

            return cacheValue;
        },
        async set(key, cacheHandlerValue) {
            assertClientIsReady();

            const signal = AbortSignal.timeout(timeoutMs);

            let setOperation: Promise<string | null>;

            let expireOperation: Promise<number> | undefined;

            switch (keyExpirationStrategy) {
                case 'EXAT': {
                    setOperation = client.withAbortSignal(signal).set(
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
                    setOperation = client
                        .withAbortSignal(signal)
                        .set(keyPrefix + key, JSON.stringify(cacheHandlerValue));

                    expireOperation = cacheHandlerValue.lifespan
                        ? client.withAbortSignal(signal).expireAt(keyPrefix + key, cacheHandlerValue.lifespan.expireAt)
                        : undefined;
                    break;
                }
                default: {
                    throw new Error(`Invalid keyExpirationStrategy: ${keyExpirationStrategy}`);
                }
            }

            const setTagsOperation =
                cacheHandlerValue.tags.length > 0
                    ? client
                          .withAbortSignal(signal)
                          .hSet(keyPrefix + sharedTagsKey, key, JSON.stringify(cacheHandlerValue.tags))
                    : undefined;

            await Promise.all([setOperation, expireOperation, setTagsOperation]);
        },
        async revalidateTag(tag) {
            assertClientIsReady();

            // If the tag is an implicit tag, we need to mark it as revalidated.
            // The revalidation process is done by the CacheHandler class on the next get operation.
            if (isImplicitTag(tag)) {
                await client.withAbortSignal(AbortSignal.timeout(timeoutMs)).hSet(revalidatedTagsKey, tag, Date.now());
            }

            const tagsMap: Map<string, string[]> = new Map();

            let cursor = '0';

            const hScanOptions = { COUNT: revalidateTagQuerySize };

            do {
                const remoteTagsPortion = await client.hScan(keyPrefix + sharedTagsKey, cursor, hScanOptions);

                for (const { field, value } of remoteTagsPortion.entries) {
                    tagsMap.set(field, JSON.parse(value));
                }

                cursor = remoteTagsPortion.cursor;
            } while (cursor !== '0');

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

            const deleteKeysOperation = client.withAbortSignal(AbortSignal.timeout(timeoutMs)).unlink(keysToDelete);

            const updateTagsOperation = client
                .withAbortSignal(AbortSignal.timeout(timeoutMs))
                .hDel(keyPrefix + sharedTagsKey, tagsToDelete);

            await Promise.all([deleteKeysOperation, updateTagsOperation]);
        },
        async delete(key) {
            await client.withAbortSignal(AbortSignal.timeout(timeoutMs)).unlink(key);
        },
    };
}
