// @ts-check

const { IncrementalCache } = require('@neshca/cache-handler');
const { reviveFromBase64Representation, replaceJsonWithBase64 } = require('@neshca/json-replacer-reviver');
const { fetch } = require('undici');

const baseUrl = process.env.REMOTE_CACHE_SERVER_BASE_URL ?? 'http://localhost:8080';

/** @type {import('@neshca/cache-handler').Cache} */
const cache = {
    async get(key) {
        const result = await fetch(`${baseUrl}/get?${new URLSearchParams({ key })}`);

        if (!result.ok) {
            return null;
        }

        try {
            const string = await result.text();

            return JSON.parse(string, reviveFromBase64Representation);
        } catch (error) {
            return null;
        }
    },
    async set(key, value, ttl) {
        await fetch(`${baseUrl}/set`, {
            method: 'POST',
            body: JSON.stringify([key, JSON.stringify(value, replaceJsonWithBase64), ttl]),
            headers: {
                'Content-Type': 'application/json',
            },
        });
    },
    // @ts-ignore
    async getTagsManifest() {
        const response = await fetch(`${baseUrl}/getTagsManifest`);

        if (!response.ok) {
            return { version: 1, items: {} };
        }

        const json = await response.json();

        return json;
    },
    async revalidateTag(tag, revalidatedAt) {
        await fetch(`${baseUrl}/revalidateTag`, {
            method: 'POST',
            body: JSON.stringify([tag, revalidatedAt]),
            headers: {
                'Content-Type': 'application/json',
            },
        });
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
