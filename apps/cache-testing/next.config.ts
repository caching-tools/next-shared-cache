import path from 'node:path';
import type { NextConfig } from 'next/types';

const cacheHandler = path.resolve('./cache-handler-redis-stack.js');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  output: 'standalone',
  cacheHandler:
    process.env.NODE_ENV !== 'development' ? cacheHandler : undefined,
  // outputFileTracingRoot: path.join(import.meta.dirname, '../../'),
  cacheMaxMemorySize: 0, // disable default in-memory caching
  experimental: {
    // PPR should only be configured via the PPR_ENABLED env variable due to conditional logic in tests.
    ppr: process.env.PPR_ENABLED === 'true',
    largePageDataBytes: 1024 * 1024, // 1MB
  },
};

export default nextConfig;
