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
            <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
            <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
            <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
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
        key: 'version-1.7.0',
        text: (
            <div>
                🎉 Version 1.7.0 is out! It has{' '}
                <a
                    href="/usage/populating-cache-on-start"
                    style={{
                        color: 'lightgreen',
                    }}
                >
                    a new instrumentation hook
                </a>{' '}
                to pre-populate the cache with pre-rendered pages on startup.
            </div>
        ),
    },
};
