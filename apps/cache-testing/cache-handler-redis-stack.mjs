// @ts-check

import { CacheHandler } from '@neshca/cache-handler';
import createLruHandler from '@neshca/cache-handler/local-lru';
import createRedisHandler from '@neshca/cache-handler/redis-stack';
import { createClient } from 'redis';

CacheHandler.onCreation(async () => {
    if (!process.env.REDIS_URL) {
        console.warn('Make sure that REDIS_URL is added to the .env.local file and loaded properly.');
    }

    let client;

    try {
        // Create a Redis client.
        client = createClient({
            url: process.env.REDIS_URL,
            name: `cache-handler:${process.env.PORT ?? process.pid}`,
        });

        // Redis won't work without error handling. https://github.com/redis/node-redis?tab=readme-ov-file#events
        client.on('error', (error) => {
            if (typeof process.env.NEXT_PRIVATE_DEBUG_CACHE !== 'undefined') {
                console.error('Redis client error:', error);
            }
        });
    } catch (error) {
        console.warn('Failed to create Redis client:', error);
    }

    if (client) {
        try {
            console.info('Connecting Redis client...');

            // Wait for the client to connect.
            // Caveat: This will block the server from starting until the client is connected.
            // And there is no timeout. Make your own timeout if needed.
            await client.connect();
            console.info('Redis client connected.');
        } catch (error) {
            console.warn('Failed to connect Redis client:', error);

            console.warn('Disconnecting the Redis client...');
            // Try to disconnect the client to stop it from reconnecting.
            client
                .disconnect()
                .then(() => {
                    console.info('Redis client disconnected.');
                })
                .catch(() => {
                    console.warn('Failed to quit the Redis client after failing to connect.');
                });
        }
    }

    /** @type {import("@neshca/cache-handler").Handler | null} */
    let handler;

    if (client) {
        // Create the `redis-stack` Handler if the client is available.
        handler = createRedisHandler({
            client,
            keyPrefix: 'JSON:',
            timeoutMs: 1000,
        });
    } else {
        // Fallback to LRU handler if Redis client is not available.
        // The application will still work, but the cache will be in-memory only and not shared.
        handler = createLruHandler();
        console.warn('Falling back to LRU handler because Redis client is not available.');
    }

    return {
        handlers: [handler],
        ttl: { defaultStaleAge: 60, estimateExpireAge: (staleAge) => staleAge * 2 },
    };
});

export default CacheHandler;
