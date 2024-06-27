# `@neshca/cache-handler`

[![npm package](https://img.shields.io/npm/v/@neshca/cache-handler/latest.svg)](https://www.npmjs.com/package/@neshca/cache-handler)
[![Dependencies](https://img.shields.io/npm/dm/@neshca/cache-handler)](https://www.npmjs.com/package/@neshca/cache-handler)
[![License](https://img.shields.io/npm/l/express.svg)](https://github.com/caching-tools/next-shared-cache/blob/canary/packages/cache-handler/LICENSE)

Welcome to [**`@neshca/cache-handler`**](./packages/cache-handler/README.md), a specialized ISR/Data cache API crafted for Next.js applications. This library is designed to simplify the complex task of configuring shared cache strategies in distributed environments, such as those involving multiple and independent instances of the same application. It offers a flexible and user-friendly approach to integrating custom cache solutions and hand-crafted, pre-configured cache strategies for Redis.

### Next.js Routers support

- Full support for the Pages and the App Router.

### The importance of shared cache in distributed environments

Next.js applications are often deployed in a self-hosted distributed environment, where multiple instances of the same application are running simultaneously. In such cases, the default Next.js cache is not shared between instances, causing the data to diverge between independent instances because load balancers route requests to a different instance every time. Another significant issue with the default cache setup is on-demand revalidation; it requires manual revalidation across all application replicas.

`@neshca/cache-handler` elegantly addresses these challenges by offering:

- A straightforward API complemented by meticulously crafted Handlers.
- Comprehensive customization options.
- Simplified on-demand revalidation, akin to managing a single application instance.
- TTL by default to keep cache storage clean and space-efficient.
- One configuration for both Routes.
- [`neshCache`](https://caching-tools.github.io/next-shared-cache/functions/nesh-cache) application-side function.

### Kickstarting Your Custom Cache Solution

Begin enhancing your application's caching system with our [Installation and the First Steps](https://caching-tools.github.io/next-shared-cache/installation). This section provides all the necessary information on installation, basic configuration, and practical examples for quick and efficient integration.

### Examples and Practical Implementations

Discover the versatility of `@neshca/cache-handler` in our [Examples Section](https://caching-tools.github.io/next-shared-cache/redis), where real-world scenarios are illustrated.

Learn how to build your own Handler by reading [this guide](https://caching-tools.github.io/next-shared-cache/usage/creating-a-custom-handler).

## Contribute

[Developing and contributing to this monorepo](./docs/contributing/monorepo.md)

Or become a Backer

[![Become a Backer](https://opencollective.com/caching-tools/tiers/backer.svg?avatarHeight=64)](https://opencollective.com/caching-tools#support)

## License

All projects in this monorepo are licensed under the [MIT License](./LICENSE).
