// @ts-check

const { IncrementalCache } = require('@neshca/cache-handler');
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
