/* eslint-disable camelcase -- unstable__* */
/* eslint-disable no-console -- log errors */
import type { RedisClientType, RedisClusterType } from 'redis';
import type { TagsManifest, OnCreationCallback, CacheHandlerValue } from '../cache-handler';
import type { RedisCacheHandlerOptions, RedisJSON } from '../common-types';

let localTagsManifest: TagsManifest = {
    version: 1,
    items: {},
};

const TAGS_MANIFEST_KEY = '__sharedTagsManifest__';

export function createHandler<T extends RedisClientType | RedisClusterType>({
    client,
    diskAccessMode = 'read-yes/write-yes',
    keyPrefix = '',
    tagsManifestKey = TAGS_MANIFEST_KEY,
    unstable__logErrors,
}: RedisCacheHandlerOptions<T>): OnCreationCallback {
    return () => {
        void client.json.set(keyPrefix + tagsManifestKey, '.', localTagsManifest, {
            NX: true,
        });

        return {
            diskAccessMode,
            cache: {
                async get(key) {
                    try {
                        const cacheValue = ((await client.json.get(keyPrefix + key)) ??
                            null) as CacheHandlerValue | null;

                        if (
                            cacheValue &&
                            cacheValue.value?.kind === 'ROUTE' &&
                            // @ts-expect-error -- after JSON parsing, body is a Json Buffer representation
                            cacheValue.value.body.type === 'Buffer'
                        ) {
                            cacheValue.value.body = Buffer.from(cacheValue.value.body);
                        }

                        return cacheValue;
                    } catch (error) {
                        if (unstable__logErrors) {
                            console.error('cache.get', error);
                        }

                        return null;
                    }
                },
                async set(key, value) {
                    try {
                        await client.json.set(keyPrefix + key, '.', value as unknown as RedisJSON);
                    } catch (error) {
                        if (unstable__logErrors) {
                            console.error('cache.set', error);
                        }
                        // ignore because value will be written to disk
                    }
                },
                async getTagsManifest() {
                    try {
                        const sharedTagsManifest = ((await client.json.get(keyPrefix + tagsManifestKey)) ??
                            null) as TagsManifest | null;

                        if (sharedTagsManifest) {
                            localTagsManifest = sharedTagsManifest;
                        }

                        return localTagsManifest;
                    } catch (error) {
                        if (unstable__logErrors) {
                            console.error('cache.getTagsManifest', error);
                        }

                        return localTagsManifest;
                    }
                },
                async revalidateTag(tag, revalidatedAt) {
                    try {
                        await client.json.set(keyPrefix + tagsManifestKey, `.items.${tag}`, {
                            revalidatedAt,
                        });
                    } catch (error) {
                        if (unstable__logErrors) {
                            console.error('cache.revalidateTag', error);
                        }

                        localTagsManifest.items[tag] = { revalidatedAt };
                    }
                },
            },
        };
    };
}
