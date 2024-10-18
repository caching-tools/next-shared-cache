import nextra from 'nextra';

const basePath = process.env.CI ? '/next-shared-cache' : '';

const withNextra = nextra({
    theme: 'nextra-theme-docs',
    themeConfig: './theme.config.jsx',
    staticImage: true,
});

export default withNextra({
    output: 'export',
    basePath,
    images: { unoptimized: true },
    env: {
        NEXT_PUBLIC_BASE_URL: basePath,
    },
});
