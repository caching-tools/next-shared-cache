const incrementalCacheHandlerPath = require.resolve(process.env.CI ? './cache-handler-local' : './cache-handler-redis');

/** @type {import('next').NextConfig} */
const nextConfig = {
    poweredByHeader: false,
    reactStrictMode: true,
    experimental: {
        incrementalCacheHandlerPath,
        isrFlushToDisk: false,
    },
};

module.exports = nextConfig;
