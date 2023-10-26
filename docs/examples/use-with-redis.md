## Installation

To install the `@neshca/cache-handler` package, run the following command:

```bash
npm i -D @neshca/cache-handler
npm i -D redis
```

## Usage with Redis

In this example we assume that in your deployment you have `REDIS_URL` environment variable set to the URL of your Redis instance. You can use any other way to set the URL.

Create a file called `cache-handler.js` next to you `next.config.js` with the following contents:

### cache-handler.js with Redis

Install `@neshca/json-replacer-reviver` to efficiently store Buffers in Redis.

```bash
npm i -D @neshca/json-replacer-reviver
```

```js
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
```

### cache-handler.js with Redis Stack using JSONs

```js
const { IncrementalCache } = require('@neshca/cache-handler');
const { createClient } = require('redis');

if (!process.env.REDIS_URL) {
    console.warn('Make sure that REDIS_URL is added to the .env.local file and loaded properly.');
}

/** @type {import('@neshca/cache-handler').TagsManifest} */
let localTagsManifest = {
    version: 1,
    items: {},
};

const PREFIX = 'JSON:';
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

async function connectAndSetManifest(client) {
    try {
        await client.connect();
    } catch (error) {
        console.error('Redis connection error:', error.message);
    }

    try {
        await client.json.set(TAGS_MANIFEST_KEY, '.', localTagsManifest, { NX: true });
    } catch (error) {
        console.error('Redis set tagsManifest error:', error.message);
    }
}

if (process.env.SERVER_STARTED) {
    const client = createRedisClient(process.env.REDIS_URL);

    connectAndSetManifest(client).then(() => {
        console.log('Redis connected');
    });

    IncrementalCache.onCreation(() => {
        return {
            cache: {
                async get(key) {
                    try {
                        return (await client.json.get(PREFIX + key)) ?? null;
                    } catch (error) {
                        return null;
                    }
                },
                async set(key, value) {
                    try {
                        await client.json.set(PREFIX + key, '.', value);
                    } catch (error) {
                        // ignore because value will be written to disk
                    }
                },
                async getTagsManifest() {
                    try {
                        const sharedTagsManifest = (await client.json.get(TAGS_MANIFEST_KEY)) ?? null;

                        if (sharedTagsManifest) {
                            localTagsManifest = sharedTagsManifest;
                        }

                        return localTagsManifest;
                    } catch (error) {
                        return localTagsManifest;
                    }
                },
                async revalidateTag(tag, revalidatedAt) {
                    try {
                        await client.json.set(TAGS_MANIFEST_KEY, `.items.${tag}`, { revalidatedAt });
                    } catch (error) {
                        localTagsManifest.items[tag] = { revalidatedAt };
                    }
                },
            },
        };
    });
}

module.exports = IncrementalCache;
```

Then, use the following configuration in your `next.config.js` file:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        incrementalCacheHandlerPath: require.resolve('./cache-handler'), // path to the cache handler file you created
    },
};

module.exports = nextConfig;
```

## Build and start your app

Finally, build the production version of your Next.js app and start it using the `SERVER_STARTED` environment variable:

```bash
npm run build
SERVER_STARTED=1 npm run start
```

Note that in the `build` step you don't need to set `SERVER_STARTED` environment variable.
