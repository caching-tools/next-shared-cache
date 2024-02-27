// @ts-check

import { CacheHandler } from '@neshca/cache-handler';
import createLruHandler from '@neshca/cache-handler/local-lru';
import createRedisHandler from '@neshca/cache-handler/redis-stack';
import createRedisStringsHandler from '@neshca/cache-handler/redis-strings';
import { createClient } from 'redis';

CacheHandler.onCreation(async () => {
    if (!process.env.REDIS_URL) {
        console.warn('Make sure that REDIS_URL is added to the .env.local file and loaded properly.');
    }

    const client = createClient({
        url: process.env.REDIS_URL,
        name: `cache-handler:${process.env.PORT ?? process.pid}`,
    });

    client.on('error', () => {});

    console.info('Connecting Redis client...');
    await client.connect();
    console.info('Redis client connected.');

    const redisHandler = await createRedisHandler({
        client,
        keyPrefix: 'JSON:',
        timeoutMs: 1000,
    });

    const redisStringsHandler = createRedisStringsHandler({ client, keyPrefix: 'strings:', timeoutMs: 1000 });

    const localHandler = createLruHandler();

    return {
        handlers: [redisHandler, redisStringsHandler, localHandler],
        ttl: { defaultStaleAge: 60, estimateExpireAge: (staleAge) => staleAge * 2 },
    };
});

export default CacheHandler;
