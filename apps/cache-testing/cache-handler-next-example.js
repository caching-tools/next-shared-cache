const cache = new Map();

module.exports = class CacheHandler {
    constructor(options) {
        this.options = options;
    }

    // biome-ignore lint/suspicious/useAwait: don't bother
    async get(key) {
        // This could be stored anywhere, like durable storage
        return cache.get(key);
    }

    // biome-ignore lint/suspicious/useAwait: don't bother
    async set(key, data, ctx) {
        // This could be stored anywhere, like durable storage
        cache.set(key, {
            value: data,
            lastModified: Date.now(),
            tags: ctx.tags,
        });
    }

    // biome-ignore lint/suspicious/useAwait: don't bother
    async revalidateTag(tag) {
        // Iterate over all entries in the cache
        // biome-ignore lint/style/useConst: don't bother
        for (let [key, value] of cache) {
            // If the value's tags include the specified tag, delete this entry
            if (value.tags.includes(tag)) {
                cache.delete(key);
            }
        }
    }
};
