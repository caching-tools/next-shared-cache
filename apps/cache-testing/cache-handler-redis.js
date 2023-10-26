const { reviveFromBase64Representation, replaceJsonWithBase64 } = require('@neshca/json-replacer-reviver');
const { IncrementalCache } = require('@neshca/cache-handler');
const { createClient } = require('redis');

if (!process.env.REDIS_URL) {
    console.warn('Make sure that REDIS_URL is added to the .env.local file and loaded properly.');
}

/** @type {import('@neshca/cache-handler').TagsManifest} */
const localTagsManifest = {
    version: 1,
    items: {},
};

const PREFIX = 'string:';
const TAGS_MANIFEST_KEY = `${PREFIX}sharedTagsManifest`;
const CONNECT_TIMEOUT_MS = 5 * 50 * 1000;

function createRedisClient(url) {
    const client = createClient({
        url,
        name: `cache-handler:${PREFIX}${process.env.PORT ?? process.pid}`,
        socket: {
            connectTimeout: CONNECT_TIMEOUT_MS,
        },
    });

    client.on('error', (error) => {
        console.error('Redis error:', error.message);
    });

    return client;
}

async function connect(client) {
    try {
        await client.connect();
    } catch (error) {
        console.error('Redis connection error:', error.message);
    }
}

if (process.env.SERVER_STARTED) {
    IncrementalCache.onCreation(() => {
        const client = createRedisClient(process.env.REDIS_URL);

        connect(client).then(() => {
            console.log('Redis connected');
        });

        return {
            cache: {
                async get(key) {
                    try {
                        const result = await client.get(PREFIX + key);

                        if (!result) {
                            return null;
                        }

                        return JSON.parse(result, reviveFromBase64Representation);
                    } catch (error) {
                        return null;
                    }
                },
                async set(key, value) {
                    try {
                        await client.set(PREFIX + key, JSON.stringify(value, replaceJsonWithBase64));
                    } catch (error) {
                        // ignore because value will be written to disk
                    }
                },
                async getTagsManifest() {
                    try {
                        const remoteTagsManifest = await client.hGetAll(TAGS_MANIFEST_KEY);

                        if (!remoteTagsManifest) {
                            return localTagsManifest;
                        }

                        Object.entries(remoteTagsManifest).reduce((acc, [tag, revalidatedAt]) => {
                            acc[tag] = { revalidatedAt: parseInt(revalidatedAt ?? '0', 10) };
                            return acc;
                        }, localTagsManifest.items);

                        return localTagsManifest;
                    } catch (error) {
                        return localTagsManifest;
                    }
                },
                async revalidateTag(tag, revalidatedAt) {
                    try {
                        await client.hSet(TAGS_MANIFEST_KEY, {
                            [tag]: revalidatedAt,
                        });
                    } catch (error) {
                        localTagsManifest.items[tag] = { revalidatedAt };
                    }
                },
            },
        };
    });
}

module.exports = IncrementalCache;
