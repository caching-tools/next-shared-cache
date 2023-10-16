# `@neshca/cache-handler`

Flexible API to replace the default Next.js cache, accommodating custom cache solutions for multi-instance deployments.

## Overview

Next.js, by default, utilizes an [in-memory cache](https://nextjs.org/blog/next-13-2#nextjs-cache-when-self-hosted) and the file system for storing `.html` (entire pages), `.json`, and `.rsc` (page props or React Server Components). Suppose you're self-hosting and running multiple instances of Next.js apps. In that case, the Next.js team recommends turning off in-memory caching and using a shared network mount within your Kubernetes pods or a similar configuration. This approach allows different containers to access the same file-system cache. Check out [this guide](https://nextjs.org/docs/pages/building-your-application/data-fetching/incremental-static-regeneration#self-hosting-isr). While effective, this method does demand a persistent shared network mount, which might not always be feasible, and it can add a layer of infrastructure complexity. Also, opting out of in-memory caching can hurt performance.

`@neshca/cache-handler` provides an API for [custom cache handlers](https://nextjs.org/docs/app/api-reference/next-config-js/incrementalCacheHandlerPath) that can seamlessly replace the default Next.js Cache. The API is designed to be flexible and allow you to use any cache-store.

## Project Status

This project is currently in the field test phase. Any changes made to the API will result in a minor version increase of the package until it reaches a stable version. You are welcome to try it out and provide feedback.

### Roadmap

-   [x] Support for App routes;
-   [x] Support for Pages routes;
-   [x] Happy path tests;
-   [x] Examples;
-   [ ] Full test coverage;
-   [ ] Documentation;

## Supported Next.js versions

Next.js 13.5.0 and above.

## Examples

-   [Redis](../../docs/examples/use-with-redis.md)
-   [HTTP server](../../docs/examples/use-with-http-server.md)

## Developing and contributing

[Developing and contributing](../../docs/contributing/main.md)

## License

[MIT](./LICENSE)
