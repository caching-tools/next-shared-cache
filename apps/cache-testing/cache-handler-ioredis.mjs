// @ts-check

import { CacheHandler } from '@neshca/cache-handler';
import createIORedisHandler from '@neshca/cache-handler/ioredis-cluster';
import Redis from 'ioredis';

CacheHandler.onCreation(async () => {
    if (!process.env.REDIS_URL) {
        console.warn('Make sure that REDIS_URL is added to the .env.local file and loaded properly.');
    }

    const redisURL = new URL(process.env.REDIS_URL ?? 'redis://localhost:6379')
    /** @type {import("ioredis").Redis} */
    const client = new Redis({
        host: redisURL.hostname,
        port: Number(redisURL.port)
    })

    const PREFIX = 'string:';

    client.on('error', (error) => {
        if (typeof process.env.NEXT_PRIVATE_DEBUG_CACHE !== 'undefined') {
            console.error('Redis client error:', error);
        }
    })

    console.info('Connecting Redis client...');
    await client.ping();
    console.info('Redis client connected.');

    const redisHandler = createIORedisHandler({
        client,
        keyPrefix: PREFIX,
    });

    return {
        handlers: [redisHandler],
        ttl: { defaultStaleAge: 60, estimateExpireAge: (staleAge) => staleAge * 2 },
    };
});

export default CacheHandler;
