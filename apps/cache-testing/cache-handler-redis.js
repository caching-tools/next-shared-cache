const { RemoteCacheHandler } = require('@neshca/handler-redis');
const { createClient } = require('redis');

const client = createClient({
    url: process.env.REDIS_URL,
    name: 'cache-testing',
});

client.on('error', (err) => {
    console.log('Redis Client Error', err);
});

RemoteCacheHandler.setRedisClient(client);

RemoteCacheHandler.setPrefix('app:cache-testing:');

RemoteCacheHandler.connect().then();

module.exports = RemoteCacheHandler;
