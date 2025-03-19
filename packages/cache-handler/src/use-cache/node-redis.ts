import type { createClient } from 'redis';
import { createRedisTimeoutConfig } from '../helpers/create-redis-timeout-config.js';
import { type RemoteStore, createCacheHandler } from '../use-cache-cache.js';

export type Config<T extends ReturnType<typeof createClient>> = {
  client: T;
  keyPrefix?: string;
  sharedTagsKey?: string;
  timeoutMs?: number;
};

function createRedisStore<T extends ReturnType<typeof createClient>>({
  client,
  keyPrefix,
  sharedTagsKey,
  timeoutMs = 5000,
}: Config<T>): RemoteStore {
  const getKey = (key: string) => `${keyPrefix}${key}`;
  const getSharedTagsKey = () => `${keyPrefix}${sharedTagsKey}`;

  return {
    async get(key) {
      if (!client.isReady) {
        return Promise.resolve(undefined);
      }

      const options = createRedisTimeoutConfig(timeoutMs);

      return (await client.get(options, getKey(key))) ?? undefined;
    },
    async set(key, value) {
      if (!client.isReady) {
        return;
      }

      const options = createRedisTimeoutConfig(timeoutMs);

      await client.set(options, getKey(key), value);
    },
    async expireTags(expiredTags) {
      if (!client.isReady) {
        return;
      }

      const options = createRedisTimeoutConfig(timeoutMs);

      await client.hSet(
        options,
        getSharedTagsKey(),
        Object.fromEntries(expiredTags),
      );
    },
    getExpirationTimestamps() {
      return Promise.resolve([]);
    },
    async refreshTags(tagsManifest) {
      try {
        if (!client?.isReady) {
          return;
        }

        let cursor = 0;

        const hScanOptions = { COUNT: 10 };

        do {
          const options = createRedisTimeoutConfig(timeoutMs);

          const remoteTagsPortion = await client.hScan(
            options,
            getSharedTagsKey(),
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
    },
  };
}

export function createRedisCacheHandler<
  T extends ReturnType<typeof createClient>,
>({ client, keyPrefix, sharedTagsKey, timeoutMs }: Config<T>) {
  const remoteStore = client
    .connect()
    .then((redisClient) => ({
      client: redisClient,
      keyPrefix,
      sharedTagsKey,
      timeoutMs,
    }))
    .then(createRedisStore);

  return createCacheHandler(remoteStore);
}
