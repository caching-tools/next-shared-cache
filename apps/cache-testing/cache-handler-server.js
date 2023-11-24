const { IncrementalCache } = require('@neshca/cache-handler');
const { createHandler } = require('@neshca/cache-handler/server');

const baseUrl = process.env.REMOTE_CACHE_SERVER_BASE_URL ?? 'http://localhost:8080';

async function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

IncrementalCache.onCreation(async (options) => {
    // For testing purposes
    await wait(100);

    const getConfig = createHandler({
        baseUrl,
    });

    return getConfig(options);
});

module.exports = IncrementalCache;
