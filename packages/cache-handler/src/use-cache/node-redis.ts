import { randomUUID } from 'node:crypto';
import { tagsManifest } from 'next/dist/server/lib/incremental-cache/tags-manifest.external.js';
import { createCacheHandler } from '../use-cache-cache.js';
import type { CacheHandlerV2, RemoteStore } from '../use-cache-cache.js';
import type { RedisClientType } from 'redis';

export type Config<T extends RedisClientType> = {
  client: T;
  pubClient: T;
  subClientId: string;
  channel: string;
  keyPrefix?: string;
  timeoutMs?: number;
  expireTrigger?: 'stale' | 'expire';
};

type Message = {
  expiredTags: Record<string, number>;
  subClientId: string;
};

/**
 * Creates a remote store that uses Redis to store and retrieve cache entries.
 *
 * @param config - The configuration for the remote store.
 *
 * @param config.client - The Redis client.
 *
 * @param config.pubClient - The Redis publish client.
 *
 * @param config.channel - The channel to use for the Redis pub/sub.
 *
 * @param config.subClientId - The ID of the Redis subscriber client.
 *
 * @param config.keyPrefix - The prefix to use for the Redis keys.
 *
 * @param config.timeoutMs - The timeout for the Redis operations.
 *
 * @param config.expireTrigger - The trigger for the Redis expiration.
 *
 * @returns A remote store that uses Redis to store and retrieve cache entries.
 */
function createRedisStore<T extends RedisClientType>({
  client,
  pubClient,
  channel,
  subClientId,
  keyPrefix = '',
  timeoutMs = 5000,
  expireTrigger = 'stale',
}: Config<T>): RemoteStore {
  const getKey = (key: string): string => `${keyPrefix}${key}`;

  return {
    async get(key): Promise<string | undefined> {
      if (!client.isReady) {
        return;
      }

      const signal = AbortSignal.timeout(timeoutMs);

      return (
        (await client.withAbortSignal(signal).get(getKey(key))) ?? undefined
      );
    },
    async set(key, value, { expire, timestamp, stale }): Promise<void> {
      if (!client.isReady) {
        return;
      }

      const signal = AbortSignal.timeout(timeoutMs);

      const expireAt =
        expireTrigger === 'stale'
          ? Math.floor(timestamp / 1000 + Math.min(expire, stale))
          : Math.floor(timestamp / 1000 + expire);

      await client.withAbortSignal(signal).set(getKey(key), value, {
        EXAT: expireAt,
      });
    },
    async expireTags(expiredTags): Promise<void> {
      if (!pubClient.isReady) {
        return;
      }

      await pubClient.publish(
        channel,
        JSON.stringify({
          expiredTags: Object.fromEntries(expiredTags),
          subClientId,
        } satisfies Message),
      );
    },
    getExpirationTimestamps(): Promise<number[]> {
      return Promise.resolve([0]);
    },
    async refreshTags(): Promise<void> {
      // must be empty when using pub/sub
    },
  };
}

/**
 * Creates a cache handler that uses Redis to store and retrieve cache entries.
 *
 * @param config - The configuration for the cache handler.
 *
 * @param config.client - The Redis client.
 *
 * @param config.keyPrefix - The prefix to use for the Redis keys.
 *
 * @param config.timeoutMs - The timeout for the Redis operations.
 *
 * @returns A cache handler that uses Redis to store and retrieve cache entries.
 */
export function createRedisCacheHandler<T extends RedisClientType>({
  client,
  keyPrefix,
  timeoutMs,
}: Config<T>): CacheHandlerV2 {
  const remoteStore = Promise.all([
    client.connect(),
    client.duplicate().connect(),
    client.duplicate().connect(),
  ])
    .then(async ([mainClient, pubClient, subClient]) => {
      const subClientId = randomUUID();
      const channel = keyPrefix
        ? `${keyPrefix}__revalidate_channel__`
        : '__revalidate_channel__';

      await subClient.subscribe(channel, (message) => {
        const { expiredTags, subClientId: messageSubClientId } = JSON.parse(
          message,
        ) as Message;

        if (subClientId === messageSubClientId) {
          console.info('ignoring message from self');
          return;
        }

        for (const [tag, timestamp] of Object.entries(expiredTags)) {
          tagsManifest.set(tag, timestamp);
        }
      });

      return { mainClient, pubClient, subClientId, channel };
    })
    .then(({ mainClient, pubClient, subClientId, channel }) => ({
      client: mainClient,
      pubClient,
      subClientId,
      channel,
      keyPrefix,
      timeoutMs,
    }))
    .then(createRedisStore);

  return createCacheHandler(remoteStore);
}
