import { randomUUID } from 'node:crypto';
import { tagsManifest } from 'next/dist/server/lib/incremental-cache/tags-manifest.external.js';
import type { createClient } from 'redis';
import { createRedisTimeoutConfig } from '../helpers/create-redis-timeout-config.js';
import { type RemoteStore, createCacheHandler } from '../use-cache-cache.js';

export type Config<T extends ReturnType<typeof createClient>> = {
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

function createRedisStore<T extends ReturnType<typeof createClient>>({
  client,
  pubClient,
  channel,
  subClientId,
  keyPrefix,
  timeoutMs = 5000,
  expireTrigger = 'stale',
}: Config<T>): RemoteStore {
  const getKey = (key: string) => `${keyPrefix}${key}`;

  return {
    async get(key) {
      if (!client.isReady) {
        return;
      }

      const options = createRedisTimeoutConfig(timeoutMs);

      return (await client.get(options, getKey(key))) ?? undefined;
    },
    async set(key, value, { expire, timestamp, stale }) {
      if (!client.isReady) {
        return;
      }

      const options = createRedisTimeoutConfig(timeoutMs);

      const expireAt =
        expireTrigger === 'stale'
          ? Math.floor(timestamp / 1000 + Math.min(expire, stale))
          : Math.floor(timestamp / 1000 + expire);

      await client.set(options, getKey(key), value, {
        EXAT: expireAt,
      });
    },
    async expireTags(expiredTags) {
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
    getExpirationTimestamps() {
      return Promise.resolve([0]);
    },
    async refreshTags() {
      // must be empty when using pub/sub
    },
  };
}

export function createRedisCacheHandler<
  T extends ReturnType<typeof createClient>,
>({ client, keyPrefix, timeoutMs }: Config<T>) {
  const remoteStore = Promise.all([
    client.connect(),
    client.duplicate().connect(),
    client.duplicate().connect(),
  ])
    .then(async ([mainClient, pubClient, subClient]) => {
      const subClientId = randomUUID();
      const channel = `${keyPrefix}__revalidate_channel__`;

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
