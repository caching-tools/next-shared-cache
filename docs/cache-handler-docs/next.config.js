/** @type {import('nextra').NextraConfig} */
const nextraConfig = {
    theme: 'nextra-theme-docs',
    themeConfig: './theme.config.jsx',
    staticImage: true,
};

const withNextra = require('nextra')(nextraConfig);

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    basePath: '/next-shared-cache',
    images: { unoptimized: true },
};

module.exports = withNextra(nextConfig);