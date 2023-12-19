const path = require('node:path');

const incrementalCacheHandlerPath = require.resolve(
    process.env.ACT ? './cache-handler-server' : './cache-handler-redis-stack',
);

/** @type {import('next').NextConfig} */
const nextConfig = {
    poweredByHeader: false,
    reactStrictMode: true,
    output: 'standalone',
    experimental: {
        incrementalCacheHandlerPath: process.env.NODE_ENV !== 'development' ? incrementalCacheHandlerPath : undefined,
        // PPR should only be configured via the PPR_ENABLED env variable due to conditional logic in tests.
        ppr: process.env.PPR_ENABLED === 'true',
        largePageDataBytes: 1024 * 1024, // 1MB
        outputFileTracingRoot: path.join(__dirname, '../../'),
    },
};

module.exports = nextConfig;
