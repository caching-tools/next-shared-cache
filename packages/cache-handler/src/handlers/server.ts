/* eslint-disable camelcase -- unstable__* */
/* eslint-disable no-console -- log errors */
import { reviveFromBase64Representation, replaceJsonWithBase64 } from '@neshca/json-replacer-reviver';
import type { TagsManifest, OnCreationHook, CacheHandlerValue } from '../cache-handler';
import type { ServerCacheHandlerOptions } from '../common-types';

const localTagsManifest: TagsManifest = {
    version: 1,
    items: {},
};

export function createHandler({
    baseUrl,
    diskAccessMode = 'read-yes/write-yes',
    unstable__logErrors,
}: ServerCacheHandlerOptions): OnCreationHook {
    return function getConfig() {
        return {
            diskAccessMode,
            cache: {
                async get(key) {
                    try {
                        const response = await fetch(`${baseUrl}/get?${new URLSearchParams({ key }).toString()}`, {
                            // @ts-expect-error -- act as an internal fetch call
                            next: {
                                internal: true,
                            },
                        });

                        if (!response.ok) {
                            return null;
                        }

                        if (response.status > 500 && response.status < 600) {
                            throw new Error(`Server error: ${response.status}`);
                        }

                        const string = await response.text();

                        return JSON.parse(string, reviveFromBase64Representation) as CacheHandlerValue;
                    } catch (error) {
                        if (unstable__logErrors) {
                            console.error('cache.get', error);
                        }

                        return null;
                    }
                },
                async set(key, value, ttl) {
                    try {
                        const response = await fetch(`${baseUrl}/set`, {
                            method: 'POST',
                            body: JSON.stringify([key, JSON.stringify(value, replaceJsonWithBase64), ttl]),
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            // @ts-expect-error -- act as an internal fetch call
                            next: {
                                internal: true,
                            },
                        });

                        if (response.status > 500 && response.status < 600) {
                            throw new Error(`Server error: ${response.status}`);
                        }
                    } catch (error) {
                        if (unstable__logErrors) {
                            console.error('cache.set', error);
                        }
                    }
                },

                async getTagsManifest() {
                    try {
                        const response = await fetch(`${baseUrl}/getTagsManifest`, {
                            // @ts-expect-error -- act as an internal fetch call
                            next: {
                                internal: true,
                            },
                        });

                        if (!response.ok) {
                            return localTagsManifest;
                        }

                        if (response.status > 500 && response.status < 600) {
                            throw new Error(`Server error: ${response.status}`);
                        }

                        const json = (await response.json()) as TagsManifest;

                        return json;
                    } catch (error) {
                        if (unstable__logErrors) {
                            console.error('cache.getTagsManifest', error);
                        }

                        return localTagsManifest;
                    }
                },
                async revalidateTag(tag, revalidatedAt) {
                    try {
                        const response = await fetch(`${baseUrl}/revalidateTag`, {
                            method: 'POST',
                            body: JSON.stringify([tag, revalidatedAt]),
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            // @ts-expect-error -- act as an internal fetch call
                            next: {
                                internal: true,
                            },
                        });

                        if (response.status > 500 && response.status < 600) {
                            throw new Error(`Server error: ${response.status}`);
                        }
                    } catch (error) {
                        if (unstable__logErrors) {
                            console.error('cache.revalidateTag', error);
                        }
                    }

                    localTagsManifest.items[tag] = { revalidatedAt };
                },
            },
        };
    };
}
