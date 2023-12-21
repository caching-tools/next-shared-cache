const { IncrementalCache } = require('@neshca/cache-handler');
const createRedisCache = require('@neshca/cache-handler/redis-strings').default;
const createLruCache = require('@neshca/cache-handler/local-lru').default;
const { createClient } = require('redis');

if (!process.env.REDIS_URL) {
    console.warn('Make sure that REDIS_URL is added to the .env.local file and loaded properly.');
}

const PREFIX = 'string:';
const CONNECT_TIMEOUT_MS = 5 * 60 * 1000;

const client = createClient({
    url: process.env.REDIS_URL,
    name: `cache-handler:${PREFIX}${process.env.PORT ?? process.pid}`,
    socket: {
        connectTimeout: CONNECT_TIMEOUT_MS,
    },
});

client.on('error', (error) => {
    console.error('Redis error:', error);
});

IncrementalCache.onCreation(async () => {
    await client.connect();

    const redisCache = await createRedisCache({
        client,
        keyPrefix: PREFIX,
    });

    const localCache = createLruCache();

    return {
        cache: [redisCache, localCache],
        useFileSystem: true,
    };
});

module.exports = IncrementalCache;
