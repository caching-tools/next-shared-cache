const incrementalCacheHandlerPath = require.resolve(
    process.env.CI ? './cache-handler-http' : './cache-handler-redis-stack',
);

/** @type {import('next').NextConfig} */
const nextConfig = {
    poweredByHeader: false,
    reactStrictMode: true,
    output: 'standalone',
    experimental: {
        incrementalCacheHandlerPath,
        largePageDataBytes: 1024 * 1024, // 1MB
    },
};

module.exports = nextConfig;
