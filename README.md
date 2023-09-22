## next-shared-cache

This project provides a shared cache implementation for Next.js applications using remote server with in-memory TTL cache or Redis as the cache store.

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

Finally, use the `handler-redis` module in `next.config.js` to configure the cache handler. The `isrFlushToDisk` field is required and should be set to `false`:

```js
const nextConfig = {
    experimental: {
        incrementalCacheHandlerPath: require.resolve('./cache-handler-redis'),
        isrFlushToDisk: false,
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
