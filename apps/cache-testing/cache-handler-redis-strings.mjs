// @ts-check

import { CacheHandler } from '@neshca/cache-handler';
import createLruHandler from '@neshca/cache-handler/local-lru';
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

    client.on('error', () => {});

    console.info('Connecting Redis client...');
    await client.connect();
    console.info('Redis client connected.');

    const redisHandler = createRedisHandler({
        client,
        keyPrefix: PREFIX,
    });

    const localHandler = createLruHandler();

    return {
        handlers: [redisHandler, localHandler],
    };
});

export default CacheHandler;
