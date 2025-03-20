import Layout from './layout';
import type { AppProps } from 'next/app';

export default function MyApp({
  Component,
  pageProps,
}: AppProps): React.ReactNode {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
