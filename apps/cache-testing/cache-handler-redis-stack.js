const { IncrementalCache } = require('@neshca/cache-handler');
const createRedisCache = require('@neshca/cache-handler/redis-stack').default;
const createRedisStringsCache = require('@neshca/cache-handler/redis-strings').default;
const createLruCache = require('@neshca/cache-handler/local-lru').default;
const { createClient } = require('redis');

if (!process.env.REDIS_URL) {
    console.warn('Make sure that REDIS_URL is added to the .env.local file and loaded properly.');
}

const CONNECT_TIMEOUT_MS = 5 * 50 * 1000;

const client = createClient({
    url: process.env.REDIS_URL,
    name: `cache-handler:${process.env.PORT ?? process.pid}`,
    socket: {
        connectTimeout: CONNECT_TIMEOUT_MS,
    },
});

client.on('error', (error) => {
    console.error('Redis error:', error);
});

IncrementalCache.onCreation(async () => {
    try {
        await client.connect();
    } catch (error) {
        console.error('Redis error:', error);
    }

    const redisCache = await createRedisCache({
        client,
        keyPrefix: 'JSON:',
    });

    const redisStringsCache = createRedisStringsCache({ client, keyPrefix: 'strings:' });

    const localCache = createLruCache();

    return {
        cache: [redisCache, redisStringsCache, localCache],
        useFileSystem: true,
    };
});

module.exports = IncrementalCache;
