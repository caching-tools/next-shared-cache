import type {
  CacheEntry,
  CacheHandlerV2,
} from 'next/dist/server/lib/cache-handlers/types.js';
import {
  isStale,
  tagsManifest,
} from 'next/dist/server/lib/incremental-cache/tags-manifest.external.js';

import { type RedisClientOptions, createClient } from 'redis';

type RedisConfig = {
  url?: string;
  keyPrefix?: string;
  clientOptions?: RedisClientOptions;
  tagsScanSize?: number;
};

const DEFAULT_CONFIG: RedisConfig = {
  url: 'redis://localhost:6379',
  keyPrefix: 'neshca:',
  tagsScanSize: 10,
};

const TAGS_MANIFEST_KEY = 'tagsManifest';

type StorageCacheEntry = Omit<CacheEntry, 'value'> & {
  value: string;
};

const pendingSets = new Map<string, Promise<void>>();

function createRedisCacheHandler(config: RedisConfig = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const { url, keyPrefix, clientOptions, tagsScanSize } = mergedConfig;

  const redisConnection = createClient({
    url,
    ...clientOptions,
  });

  const connectionPromise: Promise<ReturnType<typeof createClient>> =
    redisConnection.connect().then((client) => {
      return client;
    });

  const getKey = (key: string) => `${keyPrefix}${key}`;

  const TAGS_KEY = getKey(TAGS_MANIFEST_KEY);

  async function refreshTagsFromRemote() {
    try {
      const redisClient = await connectionPromise;

      if (!redisClient?.isReady) {
        return;
      }

      let cursor = 0;

      const hScanOptions = { COUNT: tagsScanSize };

      do {
        const remoteTagsPortion = await redisClient.hScan(
          TAGS_KEY,
          cursor,
          hScanOptions,
        );

        for (const {
          field: tag,
          value: timestampStr,
        } of remoteTagsPortion.tuples) {
          try {
            const timestamp = Number.parseInt(timestampStr, 10);

            if (!Number.isNaN(timestamp)) {
              tagsManifest.set(tag, timestamp);
            }
          } catch (err) {
            console.error(`Failed to parse tag timestamp for ${tag}:`, err);
          }
        }

        cursor = remoteTagsPortion.cursor;
      } while (cursor !== 0);
    } catch (error) {
      console.error('Failed to load tags from Redis:', error);
    }
  }

  const DefaultCacheHandler: CacheHandlerV2 = {
    async get(cacheKey) {
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

        const entry: StorageCacheEntry = JSON.parse(privateEntryJson);
        const now = performance.timeOrigin + performance.now();

        if (now > entry.timestamp + entry.revalidate * 1000) {
          return undefined;
        }

        if (isStale(entry.tags, entry.timestamp)) {
          return undefined;
        }

        const cacheEntry: CacheEntry = {
          expire: entry.expire,
          revalidate: entry.revalidate,
          stale: entry.stale,
          tags: entry.tags,
          timestamp: entry.timestamp,
          value: new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(Buffer.from(entry.value, 'base64'));
              controller.close();
            },
          }),
        };

        return cacheEntry;
      } catch (error) {
        console.error('Error retrieving cache entry:', error);
        return undefined;
      }
    },

    async set(cacheKey, pendingEntry) {
      const { resolve: resolvePending, promise: pendingPromise } =
        Promise.withResolvers<void>();

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

          const chunks: Uint8Array[] = [];

          for await (const chunk of clonedValue) {
            chunks.push(chunk);
          }

          const storageEntry: StorageCacheEntry = {
            expire: entry.expire,
            revalidate: entry.revalidate,
            stale: entry.stale,
            tags: entry.tags,
            timestamp: entry.timestamp,
            value: Buffer.concat(chunks).toString('base64'),
          };

          await redisClient.set(
            getKey(cacheKey),
            JSON.stringify(storageEntry),
            {
              EXAT: Math.floor(entry.timestamp / 1000 + entry.expire),
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
    async refreshTags() {
      await refreshTagsFromRemote();
    },
    async getExpiration(...tags) {
      return Math.max(...tags.map((tag) => tagsManifest.get(tag) ?? 0));
    },
    async expireTags(...tags) {
      if (tags.length === 0) {
        return;
      }

      const timestamp = performance.timeOrigin + performance.now();

      for (const tag of tags) {
        tagsManifest.set(tag, timestamp);
      }

      const redisClient = await connectionPromise;

      if (!redisClient?.isReady) {
        return;
      }

      try {
        await redisClient.hSet(TAGS_KEY, Object.fromEntries(tagsManifest));
      } catch (error) {
        console.error('Failed to expire tags:', error);
      }
    },
  };

  return DefaultCacheHandler;
}

export default createRedisCacheHandler();

export { createRedisCacheHandler };
