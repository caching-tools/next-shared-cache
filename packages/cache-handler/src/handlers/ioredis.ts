import type { CacheHandlerValue, Handler } from '../cache-handler';
import { isImplicitTag } from '../helpers/is-implicit-tag';
import { REVALIDATED_TAGS_KEY } from '../constants';
import type { CreateIORedisHandlerOptions } from '../common-types';

export type { CreateIORedisHandlerOptions };

/**
 * Creates a Handler for handling cache operations using Redis strings.
 *
 * This function initializes a Handler for managing cache operations using Redis.
 * It supports the IORedis Client. The resulting Handler includes
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
    keyExpirationStrategy = 'EXPIREAT',
    revalidateTagQuerySize = 100,
}: CreateIORedisHandlerOptions): Handler {
    function assertClientIsReady() {
        if (client.status !== 'ready') {
            throw new Error('Redis client is not ready yet or connection is lost. Keep trying...');
        }
    }

    const revalidatedTagsKey = keyPrefix + REVALIDATED_TAGS_KEY;

    return {
        name: 'ioredis',
        async get(key, { implicitTags }) {
            assertClientIsReady();

            const result = await client.get(keyPrefix + key);

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

            const revalidationTimes = await client.hmget(
                revalidatedTagsKey,
                ...Array.from(combinedTags),
            );

            for (const timeString of revalidationTimes) {
                if (timeString && Number.parseInt(timeString, 10) > cacheValue.lastModified) {
                    await client.unlink(keyPrefix + key);

                    return null;
                }
            }

            return cacheValue;
        },
        async set(key, cacheHandlerValue) {
            assertClientIsReady();

            let setOperation: Promise<string | null>;

            let expireOperation: Promise<number> | undefined;

            switch (keyExpirationStrategy) {
                case 'EXAT': {
                  setOperation = typeof cacheHandlerValue.lifespan?.expireAt === 'number'
                    ? client.set(
                        keyPrefix + key,
                        JSON.stringify(cacheHandlerValue),
                        'EXAT',
                        cacheHandlerValue.lifespan.expireAt,
                      )
                    : client.set(
                        keyPrefix + key,
                        JSON.stringify(cacheHandlerValue),
                      );
                    break;
                }
                case 'EXPIREAT': {
                    setOperation = client.set(keyPrefix + key, JSON.stringify(cacheHandlerValue));

                    expireOperation = cacheHandlerValue.lifespan
                        ? client.expireat(keyPrefix + key, cacheHandlerValue.lifespan.expireAt)
                        : undefined;
                    break;
                }
                default: {
                    throw new Error(`Invalid keyExpirationStrategy: ${keyExpirationStrategy}`);
                }
            }

            const setTagsOperation =
                cacheHandlerValue.tags.length > 0
                    ? client.hset(keyPrefix + sharedTagsKey, key, JSON.stringify(cacheHandlerValue.tags))
                    : undefined;

            await Promise.all([setOperation, expireOperation, setTagsOperation]);
        },
        async revalidateTag(tag) {
            assertClientIsReady();

            // If the tag is an implicit tag, we need to mark it as revalidated.
            // The revalidation process is done by the CacheHandler class on the next get operation.
            if (isImplicitTag(tag)) {
                await client.hset(revalidatedTagsKey, tag, Date.now());
            }

            const tagsMap: Map<string, string[]> = new Map();

            let cursor = '0';

            do {
                const [newCursor, fieldsAndValues] = await client.hscan(
                    keyPrefix + sharedTagsKey,
                    cursor,
                    'COUNT',
                    revalidateTagQuerySize,
                );

                for (let i = 0; i < fieldsAndValues.length; i += 2) {
                    tagsMap.set(fieldsAndValues[i]!, JSON.parse(fieldsAndValues[i + 1]!));
                }

                cursor = newCursor;
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

            const deleteKeysOperation = client.unlink(keysToDelete);

            const updateTagsOperation = client.hdel(
                keyPrefix + sharedTagsKey,
                ...tagsToDelete,
            );

            await Promise.all([deleteKeysOperation, updateTagsOperation]);
        },
        async delete(key) {
            await client.unlink(key);
        },
    };
}