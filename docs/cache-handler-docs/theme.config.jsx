import { useRouter } from 'next/router';
import { useConfig } from 'nextra-theme-docs';

function Head() {
    const { asPath } = useRouter();
    const { frontMatter, title } = useConfig();
    const url = `https://caching-tools.github.io/next-shared-cache${asPath}`;

    const currentTitle = asPath === '/' ? '@neshca/cache-handler' : `${title} — @neshca/cache-handler`;

    return (
        <>
            <meta content={url} property="og:url" />
            <meta content={frontMatter.title || '@neshca/cache-handler'} property="og:title" />
            <meta
                content={frontMatter.description || '@neshca/cache-handler documentation'}
                property="og:description"
            />
            <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
            <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
            <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
            <title>{currentTitle}</title>
        </>
    );
}

export default {
    logo: <pre>@neshca/cache-handler</pre>,
    project: {
        link: 'https://github.com/caching-tools/next-shared-cache',
    },
    docsRepositoryBase: 'https://github.com/caching-tools/next-shared-cache/tree/canary/docs/cache-handler-docs',
    head: Head,
    footer: {
        content: (
            <span>
                MIT {new Date().getFullYear()} ©{' '}
                <a href="https://github.com/caching-tools/next-shared-cache" rel="noreferrer noopener" target="_blank">
                    @neshca/cache-handler
                </a>
                .
            </span>
        ),
    },
    banner: {
        key: 'version-1.9.0',
        content: (
            <div>
                🎉 Version 1.9.0 is out! This is the final release supporting Next.js 13.5.1-14.x. The upcoming version
                2.0.0 will require Next.js 15.
            </div>
        ),
    },
};
