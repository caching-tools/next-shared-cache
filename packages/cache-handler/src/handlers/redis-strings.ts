/* eslint-disable camelcase -- unstable__* */
/* eslint-disable no-console -- log errors */
import { reviveFromBase64Representation, replaceJsonWithBase64 } from '@neshca/json-replacer-reviver';
import type { RedisClientType, RedisClusterType } from 'redis';
import type { TagsManifest, OnCreationHook, CacheHandlerValue } from '../cache-handler';
import type { RedisCacheHandlerOptions } from '../common-types';

const localTagsManifest: TagsManifest = {
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
}: RedisCacheHandlerOptions<T>): OnCreationHook {
    return function getConfig() {
        return {
            diskAccessMode,
            cache: {
                async get(key) {
                    try {
                        const result = (await client.get(keyPrefix + key)) ?? null;

                        if (!result) {
                            return null;
                        }

                        // use reviveFromBase64Representation to restore binary data from Base64
                        return JSON.parse(result, reviveFromBase64Representation) as CacheHandlerValue | null;
                    } catch (error) {
                        if (unstable__logErrors) {
                            console.error('cache.get', error);
                        }

                        return null;
                    }
                },
                async set(key, value) {
                    try {
                        // use replaceJsonWithBase64 to store binary data in Base64 and save space
                        await client.set(keyPrefix + key, JSON.stringify(value, replaceJsonWithBase64));
                    } catch (error) {
                        if (unstable__logErrors) {
                            console.error('cache.set', error);
                        }
                        // ignore because value will be written to disk
                    }
                },
                async getTagsManifest() {
                    try {
                        const remoteTagsManifest = await client.hGetAll(keyPrefix + tagsManifestKey);

                        if (!remoteTagsManifest) {
                            return localTagsManifest;
                        }

                        Object.entries(remoteTagsManifest).reduce((acc, [tag, revalidatedAt]) => {
                            acc[tag] = { revalidatedAt: parseInt(revalidatedAt ?? '0', 10) };
                            return acc;
                        }, localTagsManifest.items);

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
                        await client.hSet(keyPrefix + tagsManifestKey, {
                            [tag]: revalidatedAt,
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
