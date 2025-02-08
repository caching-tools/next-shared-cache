import type { NextConfig } from 'next';
import nextra from 'nextra';

const basePath = process.env.CI ? '/next-shared-cache' : '';

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_URL: basePath,
  },
};

const withNextra = nextra({});

export default withNextra(nextConfig);
