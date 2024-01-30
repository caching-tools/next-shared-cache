import { IncrementalCache } from '@neshca/cache-handler';
import createLruCache from '@neshca/cache-handler/local-lru';
import createRedisCache from '@neshca/cache-handler/redis-stack';
import createRedisStringsCache from '@neshca/cache-handler/redis-strings';
import { createClient } from 'redis';

if (!process.env.REDIS_URL) {
    console.warn('Make sure that REDIS_URL is added to the .env.local file and loaded properly.');
}

const client = createClient({
    url: process.env.REDIS_URL,
    name: `cache-handler:${process.env.PORT ?? process.pid}`,
});

client.on('error', () => {});

IncrementalCache.onCreation(async () => {
    console.info('Connecting Redis client...');
    await client.connect();
    console.info('Redis client connected.');

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

export default IncrementalCache;
