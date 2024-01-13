## Development Setup for `@neshca/cache-handler`

Before diving into development, setting up the monorepo environment is essential. Please follow the instructions in the [monorepo setup guide](./monorepo.md) to ensure you start on the right foot.

### Redis Integration for Development

Using Redis during development provides the distinct benefit of cache inspection and understanding its behavior via Redis Insight.

To integrate Redis as a cache store:

1. **Launch a Redis Instance using Docker**:

    ```bash
    docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
    ```

2. **Setting Up the Local Environment**:

    Create a `.env.local` file in the `apps/cache-testing` directory and define the `REDIS_URL` environment variable:

    ```bash
    REDIS_URL=redis://localhost:6379
    ```

3. **Starting Development Servers**:

    To test changes in `@neshca/cache-handler`, utilize the `@neshca/cache-testing` app. Due to this app's implementation of SSG and ISR, initiate the local backend first:

    ```bash
    npm run dev:with-redis
    ```

    Subsequently, in a distinct terminal, compile and launch the `@neshca/cache-testing` app:

    ```bash
    npm run build:app
    npm run start:app
    ```

    **Note**: Always rebuild `@neshca/cache-testing` after every rebuild of `@neshca/cache-handler`.

### Running Tests Locally

Initiate local tests with:

```bash
npm run e2e:ui -w @neshca/cache-testing
```

**Important**: Clear the Redis DB before executing tests:

```bash
docker exec -it cache-handler-redis redis-cli
127.0.0.1:6379> flushall
OK
```

Your contributions to `@neshca/cache-handler` are invaluable. I appreciate your commitment to maintaining high standards.
