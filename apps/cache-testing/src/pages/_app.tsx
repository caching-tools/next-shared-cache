import type { AppProps } from 'next/app';

import Layout from './layout';

export default function MyApp({ Component, pageProps }: AppProps): JSX.Element {
    return (
        <Layout>
            <Component {...pageProps} />
        </Layout>
    );
}
