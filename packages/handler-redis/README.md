# @neshca/handler-redis

The RemoteCacheHandler class is an implementation of the CacheHandler interface that uses a remote cache handler service to get, set, and revalidate cache entries. It sends HTTP POST requests to the remote service with the cache key, cache value, and revalidated tags as JSON-encoded data.

## Installation

To install the `@neshca/handler-redis` package, run the following command:

```sh
npm install -D @neshca/handler-redis
npm install -D redis
```

## Usage

Create a file called `cache-handler.js` next to you `next.config.js` with the following contents:

```js
const { RemoteCacheHandler } = require('@neshca/handler-redis');
const { createClient } = require('redis');

const client = createClient({
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
});

client.on('error', (err) => {
    console.log('Redis Client Error', err);
});

RemoteCacheHandler.setRedisClient(client);

RemoteCacheHandler.setPrefix('app-name:');

RemoteCacheHandler.connect().then();

module.exports = RemoteCacheHandler;
```

Then, use the following configuration in your `next.config.js` file:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        incrementalCacheHandlerPath: require.resolve('./cache-handler'), // path to the cache handler file you created
        isrFlushToDisk: false, // disable writing cache to disk
    },
};

module.exports = nextConfig;
```

Use the `REDIS_URL` environment variable to set the URL of your Redis instance. If the environment variable is not set, the default URL [redis://localhost:6379](redis://localhost:6379) will be used

```sh
REDIS_URL=redis://localhost:6379/
```

For local development, you can use Docker to start a Redis instance with the following command:

```sh
docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
```
