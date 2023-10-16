# `@neshca/cache-handler`

## Overview

Next.js, by default, utilizes an [in-memory cache](https://nextjs.org/blog/next-13-2#nextjs-cache-when-self-hosted) and the file system for storing `.html` (entire pages), `.json`, and `.rsc` (page props or React Server Components). If you're self-hosting and running multiple instances of Next.js apps, the Next.js team recommends turning off in-memory caching. Instead, employ a shared network mount within your Kubernetes pods or a similar configuration. This approach allows different containers to access the same file-system cache. For a deeper dive, check out [this guide](https://nextjs.org/docs/pages/building-your-application/data-fetching/incremental-static-regeneration#self-hosting-isr). While effective, this method does demand a persistent shared network mount, which might not always be feasible, and it can add a layer of infrastructure complexity.

`@neshca/cache-handler` replaces the Next.js default cache handler. It allows you to use Redis or any other cache store as a shared cache between multiple instances of Next.js apps. This approach is similar to the one described above but doesn't require a shared network mount. Instead, it uses the experimental Next.js config option [`incrementalCacheHandlerPath`](https://nextjs.org/docs/app/api-reference/next-config-js/incrementalCacheHandlerPath).

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

-   [Redis](./docs/examples/use-with-redis.md)
-   [HTTP server](./docs/examples/use-with-http-server.md)

## Developing and contributing

[Developing and contributing](./docs/contributing/main.md)

## License

[MIT](./LICENSE)
