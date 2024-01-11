const { scheduler } = require('node:timers/promises');
const { IncrementalCache } = require('@neshca/cache-handler');
const createServerCache = require('@neshca/cache-handler/server').default;
const createLruCache = require('@neshca/cache-handler/local-lru').default;

const baseUrl = process.env.REMOTE_CACHE_SERVER_BASE_URL ?? 'http://localhost:8080';

IncrementalCache.onCreation(async () => {
    await scheduler.wait(1000);

    const httpCache = createServerCache({
        baseUrl,
    });

    const localCache = createLruCache();

    return {
        cache: [httpCache, localCache],
        useFileSystem: true,
    };
});

module.exports = IncrementalCache;
