const { IncrementalCache } = require('@neshca/cache-handler');
const { createHandler } = require('@neshca/cache-handler/server');

const baseUrl = process.env.REMOTE_CACHE_SERVER_BASE_URL ?? 'http://localhost:8080';

if (process.env.SERVER_STARTED) {
    IncrementalCache.onCreation(
        createHandler({
            baseUrl,
        }),
    );
}

module.exports = IncrementalCache;
