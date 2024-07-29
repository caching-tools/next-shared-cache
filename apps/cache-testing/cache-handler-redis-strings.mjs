// @ts-check

import { CacheHandler } from '@neshca/cache-handler';
import createRedisHandler from '@neshca/cache-handler/redis-strings';
import { createClient } from 'redis';

CacheHandler.onCreation(async () => {
    if (!process.env.REDIS_URL) {
        console.warn('Make sure that REDIS_URL is added to the .env.local file and loaded properly.');
    }

    const PREFIX = 'string:';

    /** @type {import("redis").RedisClientType} */
    const client = createClient({
        url: process.env.REDIS_URL,
        name: `cache-handler:${PREFIX}${process.env.PORT ?? process.pid}`,
    });

    // Redis won't work without error handling. https://github.com/redis/node-redis?tab=readme-ov-file#events
    client.on('error', (error) => {
        if (typeof process.env.NEXT_PRIVATE_DEBUG_CACHE !== 'undefined') {
            console.error('Redis client error:', error);
        }
    });

    console.info('Connecting Redis client...');
    await client.connect();
    console.info('Redis client connected.');

    const redisHandler = createRedisHandler({
        client,
        keyPrefix: PREFIX,
    });

    return {
        handlers: [redisHandler],
        ttl: { defaultStaleAge: 60, estimateExpireAge: (staleAge) => staleAge * 2 },
    };
});

export default CacheHandler;
