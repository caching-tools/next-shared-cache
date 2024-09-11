# `@neshca/cache-handler`

**Flexible API for replacing the default Next.js cache, enabling custom caching solutions for multi-instance self-hosted deployments.**

[![npm package](https://img.shields.io/npm/v/@neshca/cache-handler/latest.svg)](https://www.npmjs.com/package/@neshca/cache-handler)
[![Dependencies](https://img.shields.io/npm/dm/@neshca/cache-handler)](https://www.npmjs.com/package/@neshca/cache-handler)
[![License](https://img.shields.io/npm/l/express.svg)](https://github.com/caching-tools/next-shared-cache/blob/canary/packages/cache-handler/LICENSE)

## Latest Release

🎉 **Version 1.7.0** has been released! It now includes the [`registerInitialCache` instrumentation hook ↗](https://caching-tools.github.io/next-shared-cache/usage/populating-cache-on-start), which allows the cache to be pre-populated with the initial data when the application starts.

Do not forget the [`experimental-redis-cluster`](https://caching-tools.github.io/next-shared-cache/handlers/experimental-redis-cluster) Handler for Redis Cluster support from a previous release.

Check out the [changelog](https://github.com/caching-tools/next-shared-cache/blob/canary/packages/cache-handler/CHANGELOG.md) for more details.

## Table of Contents

1. [Overview](#overview)
   - [Features](#features)
2. [Getting Started](#getting-started)
3. [Examples](#examples)
4. [Requirements](#requirements)
5. [Documentation](#documentation)
6. [Contributing](#contributing)
7. [License](#license)

## Overview

Welcome to `@neshca/cache-handler` (pronounced /ˈnæʃkʌ/), a specialized ISR/Data cache API crafted for Next.js applications. This library simplifies configuring shared cache strategies in distributed environments, such as multiple, independent application instances. It offers a flexible and easy-to-integrate solution for custom cache strategies, especially for Redis.

### Features

- **Shared Cache for Distributed Environments**: Perfect for self-hosted deployments with multiple application instances.
- **Easy Customization**: Provides a straightforward API with pre-configured Handlers.
- **On-Demand Revalidation**: Simplifies revalidation across all application replicas.
- **TTL Management**: Automatic cache cleanup to keep storage space efficient.
- **Support for Next.js Routers**: Full support and one setup for the Pages and the App Router.
- **`neshCache` Function**: Utilize the [`neshCache` ↗](https://caching-tools.github.io/next-shared-cache/functions/nesh-cache) function to replace `unstable_cache` for more control over caching.
- **Pre-populate the Cache with Initial Data**: Automatically pre-populate the cache with the initial data when the application starts using the [instrumentation hook ↗](https://caching-tools.github.io/next-shared-cache/usage/populating-cache-on-start).

## Getting Started

Enhance your application's caching with our [Installation and First Steps Guide](https://caching-tools.github.io/next-shared-cache/installation). This guide covers installation, basic configuration, and practical examples for quick integration.

## Examples

Explore the versatility of `@neshca/cache-handler` in our [Examples Section](https://caching-tools.github.io/next-shared-cache/redis) with real-world scenarios. Learn how to build a custom Handler by following [this guide](https://caching-tools.github.io/next-shared-cache/usage/creating-a-custom-handler).

## Requirements

- **Next.js**: 13.5.1 or newer.
- **Node.js**: 18.17.0 or newer.

## Documentation

For detailed documentation, visit our [Documentation Page](https://caching-tools.github.io/next-shared-cache).

## Contributing

We welcome contributions! Check out our [Contributing Guide](https://github.com/caching-tools/next-shared-cache/blob/canary/docs/contributing/cache-handler.md) for more information.

## License

This project is licensed under the [MIT License](https://github.com/caching-tools/next-shared-cache/blob/canary/packages/cache-handler/LICENSE).
