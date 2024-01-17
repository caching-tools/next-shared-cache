const { IncrementalCache } = require('@neshca/cache-handler');
const createLruCache = require('@neshca/cache-handler/local-lru').default;

IncrementalCache.onCreation(async () => {
    const localCache = createLruCache();

    return {
        cache: localCache,
        useFileSystem: true,
    };
});

module.exports = IncrementalCache;
