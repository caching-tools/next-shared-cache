# `@neshca/cache-handler`

**Flexible API to replace the default Next.js cache, accommodating custom cache solutions for multi-instance self-hosted deployments**

🎉 Version 0.6.5 is out, offering stale-while-revalidate strategy emulation and codebase improvements!

Check out the [changelog](https://github.com/caching-tools/next-shared-cache/blob/canary/packages/cache-handler/CHANGELOG.md)

[![npm package](https://img.shields.io/npm/v/@neshca/cache-handler/latest.svg)](https://www.npmjs.com/package/@neshca/cache-handler)
[![Dependencies](https://img.shields.io/npm/dm/@neshca/cache-handler)](https://www.npmjs.com/package/@neshca/cache-handler)
[![License](https://img.shields.io/npm/l/express.svg)](https://github.com/caching-tools/next-shared-cache/blob/canary/packages/cache-handler/LICENSE)

# Table of Contents

1. [Overview](#overview)
2. [Getting Started with Your Own Custom Cache Solution](#getting-started-with-your-own-custom-cache-solution)
3. [Examples and Practical Implementations](#examples-and-practical-implementations)
4. [Requirements](#requirements)
5. [Documentation](#documentation)
6. [Project Status](#project-status)
7. [Roadmap](#roadmap)
8. [Developing and Contributing](#developing-and-contributing)
9. [License](#license)

## Overview

Welcome to `@neshca/cache-handler`, a specialized ISR/Data cache API crafted for Next.js applications. This library is designed to simplify the complex task of configuring shared cache strategies in distributed environments, such as those involving multiple and independent instances of the same application. It offers a flexible and user-friendly approach to integrating custom cache solutions and hand-crafted, pre-configured cache strategies for Redis.

### The Importance of Shared Cache in Distributed Instances

Next.js applications are often deployed in a self-hosted distributed environment, where multiple instances of the same application are running simultaneously. In such cases, the default Next.js cache is not shared between instances, causing the data to diverge between independent instances because load balancers route requests to a different instance every time. Another significant issue with the default cache setup is on-demand revalidation; it requires manual revalidation across all application replicas.

`@neshca/cache-handler` elegantly addresses these challenges by offering:

-   A straightforward API complemented by meticulously crafted Handlers.
-   Comprehensive customization options.
-   Simplified on-demand revalidation, akin to managing a single application instance.

## Kickstarting Your Custom Cache Solution

Begin enhancing your application's caching system with our [Installation and the First Steps ↗](https://caching-tools.github.io/next-shared-cache/installation). This section provides all the necessary information on installation, basic configuration, and practical examples for quick and efficient integration.

## Examples and Practical Implementations

Discover the versatility of `@neshca/cache-handler` in the examples section, where real-world scenarios are illustrated.

-   [Official Next.js template ↗](https://github.com/vercel/next.js/tree/canary/examples/cache-handler-redis)
-   [Redis Stack ↗](https://caching-tools.github.io/next-shared-cache/redis-stack)
-   [Redis String ↗](https://caching-tools.github.io/next-shared-cache/redis-strings)
-   [HTTP server ↗](https://caching-tools.github.io/next-shared-cache/server)
-   [Custom Redis Stack ↗](https://caching-tools.github.io/next-shared-cache/redis-stack-custom)
-   [Custom Redis String ↗](https://caching-tools.github.io/next-shared-cache/redis-strings-custom)

## Requirements

-   Next.js 13.5.1 and newer;
-   Node.js 18.17.0 and newer.

## Documentation

[Documentation ↗](https://caching-tools.github.io/next-shared-cache)

## Project Status

This project is on its way to a stable release but will remain in beta until Next.js stabilizes [cacheHandler API](https://github.com/vercel/next.js/pull/57953). Any **breaking changes** made to the API will result in a **minor** version increase of the package until it reaches a stable version. You are welcome to try it out and provide feedback.

### Roadmap

-   [x] Support for App routes;
-   [x] Support for Pages routes;
-   [x] Happy path tests;
-   [x] Examples;
-   [x] Documentation;
-   [ ] Full test coverage.

## Developing and contributing

[Developing and contributing](https://github.com/caching-tools/next-shared-cache/blob/canary/docs/contributing/cache-handler.md)

## License

[MIT](https://github.com/caching-tools/next-shared-cache/blob/canary/packages/cache-handler/LICENSE)
