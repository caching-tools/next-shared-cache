# @neshca/handler

The RemoteCacheHandler class is an implementation of the CacheHandler interface that uses a remote cache handler service to get, set, and revalidate cache entries. It sends HTTP POST requests to the remote service with the cache key, cache value, and revalidated tags as JSON-encoded data.

## Installation

To install the `@neshca/handler` package, run the following command:

```sh
npm install -D @neshca/handler
```

## Usage

Create a file called `cache-handler.js` next to you `next.config.js` with the following contents:

```js
const { RemoteCacheHandler } = require('@neshca/handler');

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

Use the `REMOTE_CACHE_HANDLER_URL` environment variable to set the URL of the remote cache handler service. If the environment variable is not set, the default URL [http://localhost:8080](http://localhost:8080) will be used

```sh
REMOTE_CACHE_HANDLER_URL=http://localhost:8080/
```
