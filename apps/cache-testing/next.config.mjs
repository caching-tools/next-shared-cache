// @ts-check

import path from 'node:path';

const cacheHandler = path.resolve(process.env.HANDLER_PATH ?? './cache-handler-redis-stack.mjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
    poweredByHeader: false,
    reactStrictMode: true,
    output: 'standalone',
    outputFileTracingRoot: path.join(import.meta.dirname, '../../'),
    cacheHandler: process.env.NODE_ENV !== 'development' ? cacheHandler : undefined,
    cacheMaxMemorySize: 0, // disable default in-memory caching
    experimental: {
        // PPR should only be configured via the PPR_ENABLED env variable due to conditional logic in tests.
        ppr: process.env.PPR_ENABLED === 'true',
        largePageDataBytes: 1024 * 1024, // 1MB
    },
};

export default nextConfig;
