## Remote cache server side

### Prepare your remote cache server

You can create you own remote cache server or use `@neshca/server` package.

#### Using `@neshca/server`

```bash
npm i -D @neshca/server
npm i -D pino fastify pino-pretty
```

Run your server:

```bash
npx @neshca/server
```

You can use `PORT` and `HOST` environment variables to configure the server.

[Available HOST options](https://fastify.dev/docs/latest/Reference/Server#listentextresolver)

## Next.js app side

### Install dependencies

```bash
npm i -D @neshca/cache-handler
npm i -D undici
npm i -D @neshca/json-replacer-reviver
```

In this example we assume that in your deployment you have `REMOTE_CACHE_SERVER_BASE_URL` environment variable set to the URL of your remote caching server.

Create a file called `cache-handler.js` next to you `next.config.js` with the following contents:

### cache-handler.js

```js
const { IncrementalCache } = require('@neshca/cache-handler');
// use `@neshca/json-replacer-reviver` to efficiently store Buffers in your cache.
const { reviveFromBase64Representation, replaceJsonWithBase64 } = require('@neshca/json-replacer-reviver');
const { fetch } = require('undici'); // use `undici` because Next.js pollutes global `fetch`.

IncrementalCache.onCreation(() => {
    if (!process.env.SERVER_STARTED) {
        return;
    }

    const baseUrl = process.env.REMOTE_CACHE_SERVER_BASE_URL ?? 'http://localhost:8080';

    /** @type {import('@neshca/cache-handler').Cache} */
    const cache = {
        get: async (key) => {
            const result = await fetch(`${baseUrl}/get?${new URLSearchParams({ key })}`);

            if (!result.ok) {
                return null;
            }

            try {
                const string = await result.text();

                return JSON.parse(string, reviveFromBase64Representation);
            } catch (error) {
                return null;
            }
        },
        set: async (key, value, ttl) => {
            await fetch(`${baseUrl}/set`, {
                method: 'POST',
                body: JSON.stringify([key, JSON.stringify(value, replaceJsonWithBase64), ttl]),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        },
        // @ts-ignore
        getTagsManifest: async () => {
            const response = await fetch(`${baseUrl}/getTagsManifest`);

            if (!response.ok) {
                return { version: 1, items: {} };
            }

            const json = await response.json();

            return json;
        },
        revalidateTag: async (tag, revalidatedAt) => {
            await fetch(`${baseUrl}/revalidateTag`, {
                method: 'POST',
                body: JSON.stringify([tag, revalidatedAt]),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        },
    };

    return {
        cache,
        /**
         * No need to write to disk, as we're using a shared cache.
         * Read is required to get pre-rendering pages from disk
         */
        diskAccessMode: 'read-yes/write-no',
    };
});

module.exports = IncrementalCache;
```

### Build and start your app

Finally, build the production version of your Next.js app and start it using the `SERVER_STARTED` environment variable:

```bash
npm run build
SERVER_STARTED=1 npm run start
```

Note that in the `build` step you don't need to set `SERVER_STARTED` environment variable.
