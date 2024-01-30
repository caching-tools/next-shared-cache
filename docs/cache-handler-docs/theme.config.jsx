import { useRouter } from 'next/router';
import { useConfig } from 'nextra-theme-docs';

function Head() {
    const { asPath } = useRouter();
    const { frontMatter } = useConfig();
    const url = `https://caching-tools.github.io/next-shared-cache${asPath}`;

    return (
        <>
            <meta content={url} property="og:url" />
            <meta content={frontMatter.title || '@neshca/cache-handler'} property="og:title" />
            <meta
                content={frontMatter.description || '@neshca/cache-handler documentation'}
                property="og:description"
            />
        </>
    );
}

export default {
    logo: <pre>@neshca/cache-handler</pre>,
    project: {
        link: 'https://github.com/caching-tools/next-shared-cache',
    },
    docsRepositoryBase: 'https://github.com/caching-tools/next-shared-cache/tree/canary/docs/cache-handler-docs',
    useNextSeoProps() {
        const { asPath } = useRouter();

        if (asPath !== '/') {
            return {
                titleTemplate: '%s — @neshca/cache-handler',
            };
        }

        return {
            titleTemplate: '@neshca/cache-handler',
        };
    },
    head: Head,
    footer: {
        text: (
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
        key: '0.6.0-release',
        text: (
            <a href="https://nextjs.org/blog/next-14-1">
                🎉 Next.js stabilized the API, and we are almost there, just a few steps before version 1.0.0!
            </a>
        ),
    },
};
