const { IncrementalCache } = require('@neshca/cache-handler');
const { createHandler } = require('@neshca/cache-handler/redis-strings');
const { createClient } = require('redis');

if (!process.env.REDIS_URL) {
    console.warn('Make sure that REDIS_URL is added to the .env.local file and loaded properly.');
}

const PREFIX = 'string:';
const CONNECT_TIMEOUT_MS = 5 * 50 * 1000;

function createRedisClient(url) {
    const client = createClient({
        url,
        name: `cache-handler:${PREFIX}${process.env.PORT ?? process.pid}`,
        socket: {
            connectTimeout: CONNECT_TIMEOUT_MS,
        },
    });

    client.on('error', (error) => {
        console.error('Redis error:', error.message);
    });

    return client;
}

async function connect(client) {
    try {
        await client.connect();
    } catch (error) {
        console.error('Redis connection error:', error.message);
    }
}

if (process.env.SERVER_STARTED) {
    const client = createRedisClient(process.env.REDIS_URL);

    connect(client).then(() => {
        console.log('Redis connected');
    });

    IncrementalCache.onCreation(
        createHandler({
            client,
            keyPrefix: PREFIX,
        }),
    );
}

module.exports = IncrementalCache;
