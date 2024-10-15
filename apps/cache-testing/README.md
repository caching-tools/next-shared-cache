# `apps/cache-testing`

## Setup

In order to run tests, you will need to have the backend running. This can be done with the following command from the root directory of this project:

```bash
npm run start:backend
```

You will also need an instance of Redis running. This can be achieved leveraging Docker and the command:

```bash
docker run -p 6379:6379 -p 8001:8001 --name cache-handler-redis redis/redis-stack:latest
```


Next, if you modified the sources of the packages, you'll need to rebuild them with:

```bash
npm run build
```

After the sources have been built, and with your `.env.local` modified to leverage the cache-handler of your choosing, run:

```
npm run build:app
```

Finally, you can run the tests with:

```
npm run e2e
```