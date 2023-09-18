import Layout from './layout';

export default function MyApp({ Component, pageProps }): JSX.Element {
    return (
        <Layout>
            <Component {...pageProps} />
        </Layout>
    );
}
