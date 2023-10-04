# @neshca/cache-handler

## Overview

This is a package that provides a cache handler for Next.js Incremental Static Regeneration (ISR). It is meant to be used with the `experimental.incrementalCacheHandlerPath` configuration option of Next.js. More information about this option can be found in the [Next.js documentation](https://nextjs.org/docs/app/api-reference/next-config-js/incrementalCacheHandlerPath).

Native Next.js ISR cache can't be shared between multiple instances. `@neshca/cache-handler` on the other hand can be used with a local or remote cache store. So you can share the cache between multiple instances of your application. In the example below, you can see how to use Redis as a cache store.

Sharing the cache between multiple instances is useful if you are using a load balancer or Kubernetes for deployment.

## Current status

This project is in the early stages of development. It is not ready for production use. API will change until the first stable release.

### Roadmap

-   [x] Support for App routes;
-   [x] Support for Pages routes;
-   [x] Happy path tests;
-   [x] Examples;
-   [ ] Full test coverage;
-   [ ] Documentation;

## Examples

-   [Redis](../../docs/examples/use-with-redis.md)
-   [HTTP server](../../docs/examples/use-with-http-server.md)

## Developing and contributing

[Developing and contributing](../../docs/contributing/main.md)

## License

[MIT](./LICENSE)
