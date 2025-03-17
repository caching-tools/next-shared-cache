import type {
  CacheEntry,
  CacheHandler,
} from 'next/dist/server/lib/cache-handlers/types.js';
import {
  isTagStale,
  tagsManifest as localTagsManifest,
} from 'next/dist/server/lib/incremental-cache/tags-manifest.external.js';

import { type RedisClientOptions, createClient } from 'redis';

/**
 * Configuration options for the Redis cache handler
 */
type RedisConfig = {
  /**
   * Redis connection URL (defaults to 'redis://localhost:6379')
   */
  url?: string;
  /**
   * Prefix for all Redis keys (defaults to 'neshca:')
   */
  keyPrefix?: string;
  /**
   * Pub/Sub channel name for tag invalidations (defaults to 'neshca:tag-invalidations')
   */
  tagChannel?: string;
  /**
   * Redis connection options passed directly to the Redis client
   */
  clientOptions?: RedisClientOptions;
  /**
   * Multiplier for revalidate time when calculating cache expiration (defaults to 2)
   */
  revalidateTimeMultiplier?: number;
  /**
   * Default expiration time in seconds when revalidate time is not available (defaults to 60)
   */
  defaultExpirationSeconds?: number;
  /**
   * Minimum expiration time in seconds (defaults to 1)
   */
  minimumExpirationSeconds?: number;
};

/**
 * Default configuration values for the Redis cache handler
 */
const DEFAULT_CONFIG: RedisConfig = {
  url: 'redis://localhost:6379',
  keyPrefix: 'neshca:',
  tagChannel: 'neshca:tag-invalidations',
  revalidateTimeMultiplier: 2,
  defaultExpirationSeconds: 60,
  minimumExpirationSeconds: 1,
};

/**
 * Key name for storing tags in Redis
 */
const TAGS_KEY = 'tags';

/**
 * Message format for tag invalidation events published to Redis
 */
type TagInvalidationMessage = {
  /**
   * Array of tags to invalidate
   */
  tags: string[];
  /**
   * Timestamp when the invalidation occurred
   */
  timestamp: number;
};

/**
 * Internal representation of a cache entry with error handling metadata
 */
type PrivateCacheEntry = {
  /**
   * The actual cache entry
   */
  entry: CacheEntry;

  /**
   * Flag indicating if this entry resulted from an error
   *
   * For the default cache we store errored cache
   * entries and allow them to be used up to 3 times
   * after that we want to dispose it and try for fresh
   *
   * If an entry is errored we return no entry
   * three times so that we retry hitting origin (MISS)
   * and then if it still fails to set after the third we
   * return the errored content and use expiration of
   * Math.min(30, entry.expiration)
   */
  isErrored: boolean;

  /**
   * Count of retry attempts for errored entries
   */
  errorRetryCount: number;
};

/**
 * Modified cache entry type for storage in Redis
 * Converts the ReadableStream value to a string for storage
 */
type StorageCacheEntry = Omit<CacheEntry, 'value'> & {
  /**
   * Base64-encoded string representation of the original value
   */
  value: string;
};

/**
 * Map to track pending cache set operations
 */
const pendingSets = new Map<string, Promise<void>>();

/**
 * Creates a Redis-based cache handler for Next.js
 *
 * @param config - Configuration options for Redis
 * @returns A CacheHandler implementation using Redis for storage and invalidation
 */
function createRedisCacheHandler(config: RedisConfig = {}) {
  // Merge default config with provided config
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const {
    url,
    keyPrefix,
    tagChannel,
    clientOptions,
    revalidateTimeMultiplier = 2,
    defaultExpirationSeconds = 60,
    minimumExpirationSeconds = 1,
  } = mergedConfig;

  // Create main Redis client
  const redisConnection = createClient({
    url,
    ...clientOptions,
  });

  // Create separate subscriber client for pub/sub
  // (Redis requires a dedicated connection for pub/sub)
  const subscriberConnection = createClient({
    url,
    ...clientOptions,
  });

  // Connect both clients
  const connectionPromise: Promise<ReturnType<typeof createClient>> =
    redisConnection.connect().then((client) => {
      return client;
    });

  /**
   * Generates a fully-qualified Redis key with the configured prefix
   *
   * @param key - The base key
   * @returns The key with prefix applied
   */
  const getKey = (key: string) => `${keyPrefix}${key}`;

  /**
   * Gets the fully-qualified Redis key for storing tags
   *
   * @returns The tags key with prefix applied
   */
  const getTagsKey = () => getKey(TAGS_KEY);

  // Initialize by loading tags from Redis and setting up subscriber
  const initializePromise = (async () => {
    try {
      // Connect subscriber
      await subscriberConnection.connect();

      // Load existing tags from Redis
      await loadTagsFromRedis();

      // Subscribe to tag invalidation channel
      if (tagChannel) {
        await subscriberConnection.subscribe(tagChannel, handleTagInvalidation);
      }

      // Use logger in production instead of console
      console.info('Redis cache handler initialized with pub/sub');
    } catch (error) {
      console.error('Failed to initialize Redis cache handler:', error);

      // Attempt reconnection for subscriber
      subscriberConnection.on('error', handleRedisError);
      subscriberConnection.on('reconnecting', handleRedisReconnecting);
      subscriberConnection.on('ready', handleRedisReady);
    }
  })();

  /**
   * Loads tags from Redis into the local tags manifest
   * Called during initialization and after reconnection
   */
  async function loadTagsFromRedis() {
    try {
      const redisClient = await connectionPromise;
      if (!redisClient?.isReady) {
        return;
      }

      const tagsData = await redisClient.hGetAll(getTagsKey());

      // Reset local cache
      for (const key of Object.keys(localTagsManifest.items)) {
        delete localTagsManifest.items[key];
      }

      // Update local cache from Redis data
      for (const [tag, timestampStr] of Object.entries(tagsData)) {
        try {
          const timestamp = Number.parseInt(timestampStr, 10);
          if (!Number.isNaN(timestamp)) {
            localTagsManifest.items[tag] = { revalidatedAt: timestamp };
          }
        } catch (err) {
          console.error(`Failed to parse tag timestamp for ${tag}:`, err);
        }
      }
    } catch (error) {
      console.error('Failed to load tags from Redis:', error);
    }
  }

  /**
   * Handles tag invalidation messages from the Redis pub/sub channel
   * Updates the local tags manifest with the received invalidation data
   *
   * @param message - JSON string containing tag invalidation information
   */
  function handleTagInvalidation(message: string) {
    try {
      const invalidation: TagInvalidationMessage = JSON.parse(message);

      // Update local tagsManifest with the received tags
      for (const tag of invalidation.tags) {
        if (!localTagsManifest.items[tag]) {
          localTagsManifest.items[tag] = {};
        }
        localTagsManifest.items[tag].revalidatedAt = invalidation.timestamp;
      }
    } catch (error) {
      console.error('Failed to process tag invalidation message:', error);
    }
  }

  /**
   * Handles Redis connection errors
   *
   * @param error - The error that occurred
   */
  function handleRedisError(error: Error) {
    console.error('Redis connection error:', error);
  }

  /**
   * Handles Redis reconnection attempts
   */
  function handleRedisReconnecting() {
    console.info('Redis reconnecting...');
  }

  /**
   * Handles successful Redis reconnection
   * Reloads tags and resubscribes to the pub/sub channel
   */
  function handleRedisReady() {
    console.info('Redis connection reestablished');
    // Reload tags and resubscribe after reconnection
    loadTagsFromRedis().then(() => {
      if (tagChannel) {
        subscriberConnection.subscribe(tagChannel, handleTagInvalidation);
      }
    });
  }

  /**
   * The Redis-based cache handler implementation
   */
  const DefaultCacheHandler: CacheHandler = {
    /**
     * Retrieves a cache entry from Redis
     *
     * @param cacheKey - The key to look up
     * @param softTags - Optional tags for soft validation
     * @returns The cache entry if found and valid, undefined otherwise
     */
    async get(cacheKey, softTags) {
      // Ensure initialization is complete
      await initializePromise;
      await pendingSets.get(cacheKey);

      const redisClient = await connectionPromise;

      if (!redisClient?.isReady) {
        return undefined;
      }

      try {
        const privateEntryJson = await redisClient.get(getKey(cacheKey));

        if (!privateEntryJson) {
          return undefined;
        }

        const privateEntry: PrivateCacheEntry = JSON.parse(privateEntryJson);
        const entry = privateEntry.entry;

        // Restore the ReadableStream from base64 string
        if (typeof entry.value === 'string') {
          const buffer = Buffer.from(entry.value, 'base64');
          entry.value = new ReadableStream({
            start(controller) {
              controller.enqueue(new Uint8Array(buffer));
              controller.close();
            },
          });
        }

        if (
          performance.timeOrigin + performance.now() >
          entry.timestamp + entry.revalidate * 1000
        ) {
          // Cache entries should expire after revalidate time
          return undefined;
        }

        if (
          isTagStale(entry.tags, entry.timestamp) ||
          isTagStale(softTags, entry.timestamp)
        ) {
          return undefined;
        }
        const [returnStream, newSaved] = entry.value.tee();
        entry.value = newSaved;

        return {
          ...entry,
          value: returnStream,
        };
      } catch (error) {
        console.error('Error retrieving cache entry:', error);
        return undefined;
      }
    },

    /**
     * Stores a cache entry in Redis
     *
     * @param cacheKey - The key to store the entry under
     * @param pendingEntry - Promise resolving to the entry to store
     */
    async set(cacheKey, pendingEntry) {
      // Ensure initialization is complete
      await initializePromise;

      let resolvePending: () => void = () => {
        //
      };

      const pendingPromise = new Promise<void>((resolve) => {
        resolvePending = resolve;
      });

      pendingSets.set(cacheKey, pendingPromise);

      const redisClient = await connectionPromise;

      if (!redisClient?.isReady) {
        resolvePending();
        pendingSets.delete(cacheKey);
        return;
      }

      try {
        const entry = await pendingEntry;

        try {
          const [value, clonedValue] = entry.value.tee();
          entry.value = value;
          const reader = clonedValue.getReader();

          const chunks: Buffer[] = [];
          // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
          // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
          // biome-ignore lint/suspicious/noEvolvingTypes: <explanation>
          for (let chunk; !(chunk = await reader.read()).done; ) {
            const buffer = Buffer.from(chunk.value);
            chunks.push(buffer);
          }

          // Combine all chunks into a single buffer and convert to base64
          const fullBuffer = Buffer.concat(
            chunks.map((chunk) => Buffer.from(chunk)),
          );

          // Replace the ReadableStream with the base64 string for storage
          const storageEntry: StorageCacheEntry = {
            ...entry,
            value: fullBuffer.toString('base64'),
          };

          const privateEntry: PrivateCacheEntry = {
            entry: storageEntry as unknown as CacheEntry,
            isErrored: false,
            errorRetryCount: 0,
          };

          // Store in Redis with an expiration
          await redisClient.set(
            getKey(cacheKey),
            JSON.stringify(privateEntry),
            {
              EXAT:
                Math.floor(Date.now() / 1000) +
                Math.max(
                  minimumExpirationSeconds,
                  Math.floor(
                    entry.revalidate * revalidateTimeMultiplier ||
                      defaultExpirationSeconds,
                  ),
                ),
            },
          );
        } catch (error) {
          console.error('Error setting cache entry:', error);
        } finally {
          resolvePending();
          pendingSets.delete(cacheKey);
        }
      } catch (_error) {
        resolvePending();
        pendingSets.delete(cacheKey);
      }
    },

    /**
     * Invalidates tags by updating their timestamps in Redis and broadcasting the change
     *
     * @param tags - The tags to invalidate
     */
    async expireTags(...tags) {
      // Ensure initialization is complete
      await initializePromise;

      if (tags.length === 0) {
        return;
      }

      const timestamp = Date.now();
      const redisClient = await connectionPromise;

      if (!redisClient?.isReady) {
        // Fallback to local update if Redis is not available
        for (const tag of tags) {
          if (!localTagsManifest.items[tag]) {
            localTagsManifest.items[tag] = {};
          }
          localTagsManifest.items[tag].revalidatedAt = timestamp;
        }
        return;
      }

      try {
        // Create a hash of tag-timestamp pairs
        const tagUpdates: Record<string, string> = {};

        // Build the hash of updates
        for (const tag of tags) {
          tagUpdates[tag] = timestamp.toString(10);

          // Also update local cache
          localTagsManifest.items[tag] ??= {};
          localTagsManifest.items[tag].revalidatedAt = timestamp;
        }

        // Use hSet with multiple fields (equivalent to hmset in newer Redis clients)
        await redisClient.hSet(getTagsKey(), tagUpdates);

        // Publish invalidation event
        const message: TagInvalidationMessage = {
          tags,
          timestamp,
        };

        if (tagChannel) {
          await redisClient.publish(tagChannel, JSON.stringify(message));
        }
      } catch (error) {
        console.error('Failed to expire tags:', error);
      }
    },

    /**
     * Handles tag invalidation received from another source
     * Simply delegates to expireTags
     *
     * @param tags - The tags to mark as invalidated
     */
    async receiveExpiredTags(...tags): Promise<void> {
      // Just delegate to expireTags which handles both local and distributed invalidation
      return await this.expireTags(...tags);
    },
  };

  return DefaultCacheHandler;
}

/**
 * Default Redis cache handler with standard configuration
 */
export default createRedisCacheHandler();

/**
 * Factory function for creating a Redis cache handler with custom configuration
 */
export { createRedisCacheHandler };
