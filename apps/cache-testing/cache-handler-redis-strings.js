const { IncrementalCache } = require('@neshca/cache-handler');
const { createHandler } = require('@neshca/cache-handler/redis-strings');
const { createClient } = require('redis');

if (!process.env.REDIS_URL) {
    console.warn('Make sure that REDIS_URL is added to the .env.local file and loaded properly.');
}

const PREFIX = 'string:';
const CONNECT_TIMEOUT_MS = 5 * 50 * 1000;

const client = createClient({
    url: process.env.REDIS_URL,
    name: `cache-handler:${PREFIX}${process.env.PORT ?? process.pid}`,
    socket: {
        connectTimeout: CONNECT_TIMEOUT_MS,
    },
});

client.on('error', (error) => {
    console.error('Redis error:', error.message);
});

IncrementalCache.onCreation(async (options) => {
    await client.connect();

    const getConfig = createHandler({
        client,
        keyPrefix: PREFIX,
    });

    return getConfig(options);
});

module.exports = IncrementalCache;
