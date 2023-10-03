const incrementalCacheHandlerPath = require.resolve(process.env.CI ? './cache-handler-http' : './cache-handler-redis');

/** @type {import('next').NextConfig} */
const nextConfig = {
    poweredByHeader: false,
    reactStrictMode: true,
    output: 'standalone',
    experimental: {
        incrementalCacheHandlerPath,
    },
};

module.exports = nextConfig;
