// @ts-check

const { IncrementalCache } = require('@neshca/cache-handler');
const { reviveFromBase64Representation, replaceJsonWithBase64 } = require('@neshca/json-replacer-reviver');
const { createClient } = require('redis');

const client = createClient({
    url: process.env.REDIS_URL,
    name: 'app:cache-testing',
});

client.connect().then();

client.on('error', (err) => {
    console.log('Redis Client Error', err);
});

/** @type {import('@neshca/cache-handler').Cache} */
const cache = {
    async get(key) {
        const result = await client.get(key);

        if (!result) {
            return null;
        }

        try {
            return JSON.parse(result, reviveFromBase64Representation);
        } catch (error) {
            return null;
        }
    },
    async set(key, value, ttl) {
        await client.set(key, JSON.stringify(value, replaceJsonWithBase64), { EX: ttl });
    },
    async getTagsManifest(prefix) {
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
    async revalidateTag(tag, revalidatedAt, prefix) {
        const options = {
            [tag]: revalidatedAt,
        };

        await client.hSet(`${prefix}tagsManifest`, options);
    },
};

IncrementalCache.configure({
    cache,
    prefix: 'app:cache-testing:',
    /**
     * No need to write to disk, as we're using a shared cache.
     * Read is required to get pre-rendering pages from disk
     */
    diskAccessMode: 'read-yes/write-no',
});

module.exports = IncrementalCache;
