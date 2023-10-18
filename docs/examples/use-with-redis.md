## Installation

To install the `@neshca/cache-handler` package, run the following command:

```bash
npm i -D @neshca/cache-handler
npm i -D redis
```

## Usage with Redis

In this example we assume that in your deployment you have `REDIS_URL` environment variable set to the URL of your Redis instance. You can use any other way to set the URL.

Create a file called `cache-handler.js` next to you `next.config.js` with the following contents:

### cache-handler.js with plain Redis

Install `@neshca/json-replacer-reviver` to efficiently store Buffers in Redis.

```bash
npm i -D @neshca/json-replacer-reviver
```

```js
const { IncrementalCache } = require('@neshca/cache-handler');
const { reviveFromBase64Representation, replaceJsonWithBase64 } = require('@neshca/json-replacer-reviver');
const { createClient } = require('redis');

const client = createClient({
    url: process.env.REDIS_URL,
});

client.on('error', (err) => {
    console.log('Redis Client Error', err);
});

IncrementalCache.onCreation(() => {
    if (!process.env.SERVER_STARTED) {
        return;
    }

    // Connect to Redis only when app is started.
    client.connect().then(() => {
        console.log('Redis connected');
    });

    /**
     * Prefix is Redis' way of namespace keys. It's not required, but it's a good practice.
     * It allows you to use the same Redis instance for multiple apps.
     * You can also use it to separate different environments (e.g. dev, staging, prod).
     * For a single app prefix should be the same across all apps instances.
     */
    const prefix = 'app:cache-testing:';

    /** @type {import('@neshca/cache-handler').Cache} */
    const cache = {
        get: async (key) => {
            const result = await client.get(prefix + key);

            if (!result) {
                return null;
            }

            try {
                return JSON.parse(result, reviveFromBase64Representation);
            } catch (error) {
                return null;
            }
        },
        set: async (key, value) => {
            await client.set(prefix + key, JSON.stringify(value, replaceJsonWithBase64));
        },
        getTagsManifest: async () => {
            const tagsManifest = await client.hGetAll(`${prefix}tagsManifest`);

            if (!tagsManifest) {
                return { version: 1, items: {} };
            }

            const items = {};

            for (const [tag, revalidatedAt] of Object.entries(tagsManifest)) {
                items[tag] = { revalidatedAt: parseInt(revalidatedAt ?? '0', 10) };
            }

            return { version: 1, items };
        },
        revalidateTag: async (tag, revalidatedAt) => {
            const options = {
                [tag]: revalidatedAt,
            };

            await client.hSet(`${prefix}tagsManifest`, options);
        },
    };

    return {
        cache,
        /**
         * No need to write to disk, as we're using a shared cache.
         * Read is required to get pre-rendering pages from disk.
         */
        diskAccessMode: 'read-yes/write-no',
    };
});

module.exports = IncrementalCache;
```

### cache-handler.js with Redis Stack using JSONs

```js
const { IncrementalCache } = require('@neshca/cache-handler');
const { createClient } = require('redis');

const client = createClient({
    url: process.env.REDIS_URL,
});

client.on('error', (err) => {
    console.log('Redis Client Error', err);
});

IncrementalCache.onCreation(() => {
    if (!process.env.SERVER_STARTED) {
        return;
    }

    /**
     * Prefix is Redis' way of namespace keys. It's not required, but it's a good practice.
     * It allows you to use the same Redis instance for multiple apps.
     * You can also use it to separate different environments (e.g. dev, staging, prod).
     * For a single app prefix should be the same across all apps instances.
     */
    const prefix = 'app:cache-testing:';

    // Connect to Redis only when app is started.
    client.connect().then(() => {
        console.log('Redis connected');
        client.json.set(`${prefix}tagsManifest`, '.', { version: 1, items: {} }).then();
    });

    /** @type {import('@neshca/cache-handler').Cache} */
    const cache = {
        // @ts-ignore
        async get(key) {
            const result = await client.json.get(prefix + key);

            return result;
        },
        async set(key, value) {
            // @ts-ignore
            await client.json.set(prefix + key, '.', value);
        },
        // @ts-ignore
        async getTagsManifest() {
            const tagsManifest = await client.json.get(`${prefix}tagsManifest`);

            return tagsManifest ?? { version: 1, items: {} };
        },
        async revalidateTag(tag, revalidatedAt) {
            await client.json.set(`${prefix}tagsManifest`, `.items.${tag}`, { revalidatedAt });
        },
    };

    return {
        cache,
        /**
         * No need to write to disk, as we're using a shared cache.
         * Read is required to get pre-rendering pages from disk
         */
        diskAccessMode: 'read-yes/write-no',
    };
});

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
