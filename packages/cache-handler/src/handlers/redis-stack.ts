import { randomBytes } from 'node:crypto';
import { ErrorReply, SCHEMA_FIELD_TYPE } from 'redis';
import { REVALIDATED_TAGS_KEY, TIME_ONE_YEAR } from '../constants.js';
import { isTagImplicit } from '../helpers/is-tag-implicit.js';
import type { CacheHandlerValue, Handler } from '../cache-handler.js';
import type {
  CreateRedisStackHandlerOptions,
  RedisJSON,
} from '../common-types.js';

export type { CreateRedisStackHandlerOptions };

type SearchNoContentReply = {
  total: number;
  documents: string[];
};

/**
 * Creates a Handler for handling cache operations using Redis JSON.
 *
 * This function initializes a Handler for managing cache operations using Redis.
 * It supports Redis Client. The resulting Handler includes
 * methods to get, set, and manage cache values fot on-demand revalidation.
 *
 * @param options - The configuration options for the Redis Stack Handler. See {@link CreateRedisStackHandlerOptions}.
 *
 * @param options.client - The Redis client.
 *
 * @param options.keyPrefix - The prefix to use for the Redis keys.
 *
 * @param options.timeoutMs - The timeout for the Redis operations.
 *
 * @param options.revalidateTagQuerySize - The size of the query to use for the revalidate tag.
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
  /**
   * Asserts that the Redis client is ready.
   *
   * @throws An error if the Redis client is not ready.
   */
  function assertClientIsReady(): void {
    if (!client.isReady) {
      throw new Error('Redis client is not ready');
    }
  }

  /**
   * Sanitizes a tag to be used in Redis.
   *
   * @param str - The tag to sanitize.
   *
   * @returns The sanitized tag.
   */
  function sanitizeTag(str: string): string {
    return str.replace(/[^a-zA-Z0-9]/gi, '_');
  }

  const indexName = `idx:tags-${randomBytes(32).toString('hex')}`;

  /**
   * Creates an index if it does not exist.
   *
   * @throws An error if the creation of the index fails but not because the index already exists.
   */
  async function createIndexIfNotExists(): Promise<void> {
    try {
      await client.ft.create(
        indexName,
        {
          '$.tags': { type: SCHEMA_FIELD_TYPE.TEXT, AS: 'tag' },
        },
        {
          ON: 'JSON',
          TEMPORARY: TIME_ONE_YEAR,
        },
      );
    } catch (error) {
      if (
        error instanceof ErrorReply &&
        error.message === 'Index already exists'
      ) {
        return;
      }

      throw error;
    }
  }

  const revalidatedTagsKey = keyPrefix + REVALIDATED_TAGS_KEY;

  return {
    name: 'redis-stack',
    async get(
      key,
      { implicitTags },
    ): Promise<CacheHandlerValue | null | undefined> {
      assertClientIsReady();

      const cacheValue = (await client
        .withAbortSignal(AbortSignal.timeout(timeoutMs))
        .json.get(keyPrefix + key)) as CacheHandlerValue | null;

      if (!cacheValue) {
        return null;
      }

      const sanitizedImplicitTags = implicitTags.map(sanitizeTag);

      const combinedTags = new Set([
        ...cacheValue.tags,
        ...sanitizedImplicitTags,
      ]);

      if (combinedTags.size === 0) {
        return cacheValue;
      }

      const revalidationTimes = await client
        .withAbortSignal(AbortSignal.timeout(timeoutMs))
        .hmGet(revalidatedTagsKey, Array.from(combinedTags));

      for (const timeString of revalidationTimes) {
        if (
          timeString &&
          Number.parseInt(timeString, 10) > cacheValue.lastModified
        ) {
          await client
            .withAbortSignal(AbortSignal.timeout(timeoutMs))
            .unlink(keyPrefix + key);

          return null;
        }
      }

      return cacheValue;
    },
    async set(key, cacheHandlerValue): Promise<void> {
      assertClientIsReady();

      cacheHandlerValue.tags = cacheHandlerValue.tags.map(sanitizeTag);

      const signal = AbortSignal.timeout(timeoutMs);

      const setCacheValue = client
        .withAbortSignal(signal)
        .json.set(
          keyPrefix + key,
          '.',
          cacheHandlerValue as unknown as RedisJSON,
        );

      const expireCacheValue = cacheHandlerValue.lifespan
        ? client
            .withAbortSignal(signal)
            .expireAt(keyPrefix + key, cacheHandlerValue.lifespan.expireAt)
        : undefined;

      await Promise.all([setCacheValue, expireCacheValue]);
    },
    async revalidateTag(tag): Promise<void> {
      assertClientIsReady();

      await createIndexIfNotExists();

      const sanitizedTag = sanitizeTag(tag);

      // If the tag is an implicit tag, we need to mark it as revalidated.
      // The revalidation process is done by the CacheHandler class on the next get operation.
      if (isTagImplicit(tag)) {
        await client
          .withAbortSignal(AbortSignal.timeout(timeoutMs))
          .hSet(revalidatedTagsKey, sanitizedTag, Date.now());
      }

      let from = 0;

      const keysToDelete: string[] = [];

      while (true) {
        const { documents: documentIds } = (await client.ft.searchNoContent(
          indexName,
          `@tag:(${sanitizedTag})`,
          {
            LIMIT: { from, size: revalidateTagQuerySize },
            TIMEOUT: timeoutMs,
          },
        )) as SearchNoContentReply;

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

      const signal = AbortSignal.timeout(timeoutMs);

      await client.withAbortSignal(signal).unlink(keysToDelete);
    },
    async delete(key): Promise<void> {
      await client.withAbortSignal(AbortSignal.timeout(timeoutMs)).unlink(key);
    },
  };
}
