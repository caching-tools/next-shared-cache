const { IncrementalCache } = require('@neshca/cache-handler');

const cache = new Map();

const tagsManifest = {
    version: 1,
    items: {},
};

IncrementalCache.cache = {
    async get(key) {
        return cache.get(key);
    },
    async set(key, value) {
        cache.set(key, value);
    },
    async getTagsManifest() {
        return tagsManifest;
    },
    async revalidateTag(_prefix, tag, revalidatedAt) {
        tagsManifest.items[tag] = { revalidatedAt };
    },
};

module.exports = IncrementalCache;
