const { IncrementalCache } = require('@neshca/cache-handler');
const createRedisCache = require('@neshca/cache-handler/redis-stack').default;
const createRedisStringsCache = require('@neshca/cache-handler/redis-strings').default;
const createLruCache = require('@neshca/cache-handler/local-lru').default;
const { createClient } = require('redis');

if (!process.env.REDIS_URL) {
    console.warn('Make sure that REDIS_URL is added to the .env.local file and loaded properly.');
}

const client = createClient({
    url: process.env.REDIS_URL,
    name: `cache-handler:${process.env.PORT ?? process.pid}`,
});

client.on('error', (error) => {
    console.error('Redis error:', error);
});

IncrementalCache.onCreation(async () => {
    console.log('Connecting Redis client...');
    await client.connect();
    console.log('Redis client connected.');

    const redisCache = await createRedisCache({
        client,
        keyPrefix: 'JSON:',
        timeoutMs: 1000,
    });

    const redisStringsCache = createRedisStringsCache({ client, keyPrefix: 'strings:', timeoutMs: 1000 });

    const localCache = createLruCache();

    return {
        cache: [redisCache, redisStringsCache, localCache],
        useFileSystem: true,
    };
});

module.exports = IncrementalCache;
