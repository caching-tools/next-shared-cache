import type {
  CacheEntry,
  CacheHandlerV2,
  Timestamp,
} from 'next/dist/server/lib/cache-handlers/types.js';
import {
  isStale,
  tagsManifest,
} from 'next/dist/server/lib/incremental-cache/tags-manifest.external.js';

export type SerializedCacheEntry = Omit<CacheEntry, 'value'> & {
  value: string;
};

export type { CacheHandlerV2, CacheEntry };

const pendingSets = new Map<string, Promise<void>>();

type RemoteStoreOptions = {
  timestamp: Timestamp;
  revalidate: number;
  expire: number;
  stale: number;
};

export type RemoteStore = {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string, options: RemoteStoreOptions): Promise<void>;
  refreshTags(tagsManifest: Map<string, number>): Promise<void>;
  getExpirationTimestamps(tags: string[]): Promise<number[]>;
  expireTags(expiredTags: Map<string, number>): Promise<void>;
};
export async function createCacheHandler(
  remoteStorePromise: Promise<RemoteStore>,
) {
  const cacheHandler: CacheHandlerV2 = {
    async get(cacheKey) {
      await pendingSets.get(cacheKey);

      try {
        const remoteStore = await remoteStorePromise;

        const serializedEntry: string | undefined =
          await remoteStore.get(cacheKey);

        if (!serializedEntry) {
          return undefined;
        }

        const entry: SerializedCacheEntry = JSON.parse(serializedEntry);

        const now = performance.timeOrigin + performance.now();

        if (now > entry.timestamp + entry.revalidate * 1000) {
          return undefined;
        }

        if (isStale(entry.tags, entry.timestamp)) {
          return undefined;
        }

        return {
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
        } satisfies CacheEntry;
      } catch (_error) {
        //
      }

      return undefined;
    },
    async set(cacheKey, pendingEntry) {
      const { resolve: resolvePending, promise: pendingPromise } =
        Promise.withResolvers<void>();

      pendingSets.set(cacheKey, pendingPromise);

      try {
        const entry = await pendingEntry;

        try {
          const [value, clonedValue] = entry.value.tee();
          entry.value = value;

          const chunks: Uint8Array[] = [];

          for await (const chunk of clonedValue) {
            chunks.push(chunk);
          }

          const storageEntry: SerializedCacheEntry = {
            expire: entry.expire,
            revalidate: entry.revalidate,
            stale: entry.stale,
            tags: entry.tags,
            timestamp: entry.timestamp,
            value: Buffer.concat(chunks).toString('base64'),
          };

          const remoteStore = await remoteStorePromise;

          await remoteStore.set(cacheKey, JSON.stringify(storageEntry), {
            expire: entry.expire,
            revalidate: entry.revalidate,
            stale: entry.stale,
            timestamp: entry.timestamp,
          });
        } catch (_error) {
          //
        } finally {
          resolvePending();
          pendingSets.delete(cacheKey);
        }
      } catch (_error) {
        //
      } finally {
        resolvePending();
        pendingSets.delete(cacheKey);
      }
    },
    async refreshTags() {
      const remoteStore = await remoteStorePromise;

      await remoteStore.refreshTags(tagsManifest);
    },
    async getExpiration(...tags) {
      const remoteStore = await remoteStorePromise;

      const timestamps = await remoteStore.getExpirationTimestamps(tags);

      return Math.max(...timestamps);
    },
    async expireTags(...tags) {
      if (tags.length === 0) {
        return;
      }

      const timestamp = performance.timeOrigin + performance.now();

      const expiredTags = new Map<string, number>();

      for (const tag of tags) {
        tagsManifest.set(tag, timestamp);
        expiredTags.set(tag, timestamp);
      }

      const remoteStore = await remoteStorePromise;

      await remoteStore.expireTags(expiredTags);
    },
  };

  return cacheHandler;
}

export default createCacheHandler;
