## next-shared-cache

## Developing

Install dependencies with:

```sh
npm ci
```

Start developing and watch for code `handler` and `server` changes:

```sh
npm run dev
```

In a new terminal run `cache-testing` app:

```sh
npm run build:app
npm run start:app
```

Remember that you need to rebuild `cache-testing` every time `handler` rebuild is happening.

## Using Redis

Use Docker CLI with this command:

```sh
docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
```

Create `.env.local` file inside `apps/cache-testing` directory and add environment variable:

```sh
REDIS_URL=redis://localhost:6379
```

Then run

```sh
npm run dev
npm run build:app
npm run start:app
```

## Contributing

Run linting and formatting jobs before commit.

```sh
npm lint
npm format
```

## Caveats

### In-memory cache in dev mode

When you run `npm dev` the `server` is in watch mode. So it drops in-memory cache every time you save change in its sources.

## Troubleshooting

If you are using VS Code and see `Parsing error: Cannot find module 'next/babel'` error in `.js` files create `.vscode/settings.json` config in the root of the project and add the following

```json
{
    "eslint.workingDirectories": [{ "pattern": "apps/*/" }, { "pattern": "packages/*/" }, { "pattern": "utils/*/" }]
}
```
