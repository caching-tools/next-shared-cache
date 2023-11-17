/** @type {import('nextra').NextraConfig} */
const nextraConfig = {
    theme: 'nextra-theme-docs',
    themeConfig: './theme.config.jsx',
    staticImage: true,
};

const withNextra = require('nextra')(nextraConfig);

const basePath = process.env.NODE_ENV === 'development' ? undefined : '/next-shared-cache';

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    basePath,
    images: { unoptimized: true },
    env: {
        NEXT_PUBLIC_BASE_URL: basePath ?? '',
    },
};

module.exports = withNextra(nextConfig);
