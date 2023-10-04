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

Then, run the following commands to start a `@neshca/backend` development server and the `@neshca/cache-testing` app:

```sh
npm run dev:backend
npm run build:app
npm run start:app
```

## Contributing

Before committing changes, run the linting and formatting jobs using `npm run lint` and `npm run format`.

```sh
npm run lint
npm run format
```

## Running tests locally

```sh
npm run e2e:ui -w ./apps/cache-testing
```
