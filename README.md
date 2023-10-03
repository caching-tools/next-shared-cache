# neshca or next-shared-cache

## Overview

This is a monorepo for `@neshca/cache-handler` package that provides a cache handler for Next.js Incremental Static Regeneration (ISR). It is meant to be used with the `experimental.incrementalCacheHandlerPath` configuration option of Next.js. More information about this option can be found in the [Next.js documentation](https://nextjs.org/docs/app/api-reference/next-config-js/incrementalCacheHandlerPath).

Native Next.js ISR cache can't be shared between multiple instances. `@neshca/cache-handler` on the other hand can be used with a local or remote cache store. So you can share the cache between multiple instances of your application. In the example below, you can see how to use Redis as a cache store.

Sharing the cache between multiple instances is useful if you are using a load balancer or Kubernetes for deployment.

## Current status

This project is in the early stages of development. It is not ready for production use. API will change until the first stable release.

### Roadmap

-   [x] Support for App routes;
-   [x] Support for Pages routes;
-   [x] Happy path tests;
-   [ ] Full test coverage;
-   [ ] Documentation;
-   [ ] Examples;

## Installation

To install the `@neshca/cache-handler` package, run the following command:

```sh
npm install -D @neshca/cache-handler
npm install -D @neshca/json-replacer-reviver
npm install -D redis
```

## Usage with Redis

Create a file called `cache-handler.js` next to you `next.config.js` with the following contents:

```js
const { IncrementalCache } = require('@neshca/cache-handler');
const { reviveFromBase64Representation, replaceJsonWithBase64 } = require('@neshca/json-replacer-reviver');
const { createClient } = require('redis');

const client = createClient({
    url: process.env.REDIS_URL,
    name: 'app:cache-testing',
});

client.connect().then();

client.on('error', (err) => {
    console.log('Redis Client Error', err);
});

/** @type {import('@neshca/cache-handler').Cache} */
const cache = {
    async get(key) {
        const result = await client.get(key);

        if (!result) {
            return null;
        }

        try {
            return JSON.parse(result, reviveFromBase64Representation);
        } catch (error) {
            return null;
        }
    },
    async set(key, value, ttl) {
        await client.set(key, JSON.stringify(value, replaceJsonWithBase64), { EX: ttl });
    },
    async getTagsManifest(prefix) {
        const tagsManifest = await client.hGetAll(`${prefix}tagsManifest`);

        if (!tagsManifest) {
            return { version: 1, items: {} };
        }

        const items = {};

        for (const [tag, revalidatedAt] of Object.entries(tagsManifest)) {
            items[tag] = { revalidatedAt: parseInt(revalidatedAt ?? '0', 10) };
        }

        return { version: 1, items };
    },
    async revalidateTag(tag, revalidatedAt, prefix) {
        const options = {
            [tag]: revalidatedAt,
        };

        await client.hSet(`${prefix}tagsManifest`, options);
    },
};

IncrementalCache.configure({
    cache,
    prefix: 'app:cache-testing:',
    /**
     * No need to write to disk, as we're using a shared cache.
     * Read is required to get pre-rendering pages from disk
     */
    diskAccessMode: 'read-yes/write-no',
});

module.exports = IncrementalCache;
```

Then, use the following configuration in your `next.config.js` file:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        incrementalCacheHandlerPath: require.resolve('./cache-handler'), // path to the cache handler file you created
    },
};

module.exports = nextConfig;
```

Use the `REDIS_URL` environment variable to set the URL of your Redis instance.

```sh
REDIS_URL=redis://localhost:6379/
```

## Developing

To get started with development, install the project dependencies using `npm ci`. Then, run `npm run dev` to start the development server and watch for changes to the `handler` and `server` modules:

```sh
npm ci
npm run build
npm run dev

```

In a separate terminal, run the `cache-testing` app using `npm run build:app` and `npm run start:app`. Note that you need to rebuild the `cache-testing` app every time the `handler` module is rebuilt:

```sh
npm run build:app
npm run start:app
```

Remember that you need to rebuild `cache-testing` every time `handler` rebuild is happening.

### Using Redis

To use Redis as the cache store, you can use Docker to start a Redis instance with the following command:

```sh
docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
```

Then, create a `.env.local` file inside the `apps/cache-testing` directory and add the `REDIS_URL` environment variable:

```sh
REDIS_URL=redis://localhost:6379
```

Finally, use the `handler-redis` module in `next.config.js` to configure the cache handler:

```js
const nextConfig = {
    experimental: {
        incrementalCacheHandlerPath: require.resolve('./cache-handler-redis'),
    },
};
```

Then, run the following commands to start the development server and the `cache-testing` app:

```sh
npm run dev:redis
npm run build:app
npm run start:app
```

## Contributing

Before committing changes, run the linting and formatting jobs using `npm run lint` and `npm run format`.

```sh
npm run lint
npm run format
```

## Caveats

### In-memory cache in dev mode

When you run `npm run dev` the `server` package is in watch mode. So it drops in-memory cache every time you make a change in sources.

## Troubleshooting

If you are using VS Code and see a `Parsing error: Cannot find module 'next/babel'` error in `.js` files, create a `.vscode/settings.json` file in the root of the project and add the following configuration:

```json
{
    "eslint.workingDirectories": [{ "pattern": "apps/*/" }, { "pattern": "packages/*/" }, { "pattern": "utils/*/" }]
}
```
