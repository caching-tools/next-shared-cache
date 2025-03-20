import superjson from 'superjson';
import { REVALIDATED_TAGS_KEY } from '../constants.js';
import { createRedisTimeoutConfig } from '../helpers/create-redis-timeout-config.js';
import { isTagImplicit } from '../helpers/is-tag-implicit.js';
import type { CacheHandlerValue, Handler } from '../cache-handler.js';
import type { CreateRedisStringsHandlerOptions } from '../common-types.js';

export type { CreateRedisStringsHandlerOptions };

/**
 * Creates a Handler for handling cache operations using Redis strings.
 *
 * This function initializes a Handler for managing cache operations using Redis.
 * It supports Redis Client. The resulting Handler includes
 * methods to get, set, and manage cache values fot on-demand revalidation.
 *
 * @param options - The configuration options for the Redis Handler.
 *
 * @param options.client - The Redis client.
 *
 * @param options.keyPrefix - The prefix to use for the Redis keys.
 *
 * @param options.sharedTagsKey - The key to use for the shared tags.
 *
 * @param options.timeoutMs - The timeout for the Redis operations.
 *
 * @param options.keyExpirationStrategy - The strategy to use for the key expiration.
 *
 * @param options.revalidateTagQuerySize - The size of the query to use for the revalidate tag.
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
  keyExpirationStrategy = 'EXPIREAT',
  revalidateTagQuerySize = 100,
}: CreateRedisStringsHandlerOptions): Handler {
  /**
   * Asserts that the Redis client is ready.
   *
   * @throws An error if the Redis client is not ready.
   */
  function assertClientIsReady(): void {
    if (!client.isReady) {
      throw new Error(
        'Redis client is not ready yet or connection is lost. Keep trying...',
      );
    }
  }

  const revalidatedTagsKey = keyPrefix + REVALIDATED_TAGS_KEY;

  return {
    name: 'redis-strings',
    async get(
      key,
      { implicitTags },
    ): Promise<CacheHandlerValue | null | undefined> {
      assertClientIsReady();

      const result = await client.get(
        createRedisTimeoutConfig(timeoutMs),
        keyPrefix + key,
      );

      if (!result) {
        return null;
      }

      const cacheValue = superjson.parse<CacheHandlerValue | null>(result);

      if (!cacheValue) {
        return null;
      }

      const combinedTags = new Set([...cacheValue.tags, ...implicitTags]);

      if (combinedTags.size === 0) {
        return cacheValue;
      }

      const revalidationTimes = await client.hmGet(
        createRedisTimeoutConfig(timeoutMs),
        revalidatedTagsKey,
        Array.from(combinedTags),
      );

      for (const timeString of revalidationTimes) {
        if (
          timeString &&
          Number.parseInt(timeString, 10) > cacheValue.lastModified
        ) {
          await client.unlink(
            createRedisTimeoutConfig(timeoutMs),
            keyPrefix + key,
          );

          return null;
        }
      }

      return cacheValue;
    },
    async set(key, cacheHandlerValue): Promise<void> {
      assertClientIsReady();

      const options = createRedisTimeoutConfig(timeoutMs);

      let setOperation: Promise<string | null>;

      let expireOperation: Promise<boolean> | undefined;

      switch (keyExpirationStrategy) {
        case 'EXAT': {
          setOperation = client.set(
            options,
            keyPrefix + key,
            superjson.stringify(cacheHandlerValue),
            typeof cacheHandlerValue.lifespan?.expireAt === 'number'
              ? {
                  EXAT: cacheHandlerValue.lifespan.expireAt,
                }
              : undefined,
          );
          break;
        }
        case 'EXPIREAT': {
          setOperation = client.set(
            options,
            keyPrefix + key,
            superjson.stringify(cacheHandlerValue),
          );

          expireOperation = cacheHandlerValue.lifespan
            ? client.expireAt(
                options,
                keyPrefix + key,
                cacheHandlerValue.lifespan.expireAt,
              )
            : undefined;
          break;
        }
        default: {
          throw new Error(
            `Invalid keyExpirationStrategy: ${keyExpirationStrategy}`,
          );
        }
      }

      const setTagsOperation =
        cacheHandlerValue.tags.length > 0
          ? client.hSet(
              options,
              keyPrefix + sharedTagsKey,
              key,
              superjson.stringify(cacheHandlerValue.tags),
            )
          : undefined;

      await Promise.all([setOperation, expireOperation, setTagsOperation]);
    },
    async revalidateTag(tag): Promise<void> {
      assertClientIsReady();

      // If the tag is an implicit tag, we need to mark it as revalidated.
      // The revalidation process is done by the CacheHandler class on the next get operation.
      if (isTagImplicit(tag)) {
        await client.hSet(
          createRedisTimeoutConfig(timeoutMs),
          revalidatedTagsKey,
          tag,
          Date.now(),
        );
      }

      const tagsMap: Map<string, string[]> = new Map();

      let cursor = 0;

      const hScanOptions = { COUNT: revalidateTagQuerySize };

      do {
        const remoteTagsPortion = await client.hScan(
          createRedisTimeoutConfig(timeoutMs),
          keyPrefix + sharedTagsKey,
          cursor,
          hScanOptions,
        );

        for (const { field, value } of remoteTagsPortion.tuples) {
          tagsMap.set(field, superjson.parse(value));
        }

        cursor = remoteTagsPortion.cursor;
      } while (cursor !== 0);

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

      const deleteKeysOperation = client.unlink(
        createRedisTimeoutConfig(timeoutMs),
        keysToDelete,
      );

      const updateTagsOperation = client.hDel(
        { isolated: true, ...createRedisTimeoutConfig(timeoutMs) },
        keyPrefix + sharedTagsKey,
        tagsToDelete,
      );

      await Promise.all([deleteKeysOperation, updateTagsOperation]);
    },
    async delete(key): Promise<void> {
      await client.unlink(createRedisTimeoutConfig(timeoutMs), key);
    },
  };
}
