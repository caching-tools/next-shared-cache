const { IncrementalCache } = require('@neshca/cache-handler');
const { reviveFromBase64Representation, replaceJsonWithBase64 } = require('@neshca/json-replacer-reviver');
const { fetch } = require('undici');

const baseUrl = process.env.BASE_URL ?? 'http://localhost:8080';

IncrementalCache.prefix = 'cache-testing:';

IncrementalCache.cache = {
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
            contentType: 'text/plain',
        });
    },
    async getTagsManifest() {
        const response = await fetch(`${baseUrl}/getTagsManifest`);

        if (!response.ok) {
            return { version: 1, items: {} };
        }

        const json = await response.json();

        return json;
    },
    async revalidateTag(_prefix, tag, revalidatedAt) {
        await fetch(`${baseUrl}/revalidateTag`, {
            method: 'POST',
            body: JSON.stringify([tag, revalidatedAt]),
            contentType: 'text/plain',
        });
    },
};

module.exports = IncrementalCache;
