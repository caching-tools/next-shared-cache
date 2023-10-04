// @ts-check

const { IncrementalCache } = require('@neshca/cache-handler');
const { reviveFromBase64Representation, replaceJsonWithBase64 } = require('@neshca/json-replacer-reviver');
const { createClient } = require('redis');

const client = createClient({
    url: process.env.REDIS_URL,
    /**
     * You can use unique name for each app instance.
     * That may help you in debugging.
     * In this example we're using the port number to make the name unique
     * because we're running multiple instances on the same machine.
     */
    name: `app:cache-testing:${process.env.PORT ?? ''}`,
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
