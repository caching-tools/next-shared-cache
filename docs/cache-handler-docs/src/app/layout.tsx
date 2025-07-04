import { Banner } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';
import { Footer, Layout, Navbar } from 'nextra-theme-docs';
import type { ReactNode } from 'react';
import 'nextra-theme-docs/style.css';

const banner = (
  <Banner storageKey="version-1.9.0">
    <div>
      🎉 Version 1.9.0 is out! This is the final release supporting Next.js
      13.5.1-14.x. The upcoming version 2.0.0 will require Next.js 15.
    </div>
  </Banner>
);

const navbar = (
  <Navbar
    logo={<pre>@neshca/cache-handler</pre>}
    projectLink="https://github.com/caching-tools/next-shared-cache"
  />
);

const footer = (
  <Footer>
    <span>
      MIT {new Date().getFullYear()} ©{' '}
      <a
        href="https://github.com/caching-tools/next-shared-cache"
        rel="noreferrer noopener"
        target="_blank"
      >
        @neshca/cache-handler
      </a>
      .
    </span>
  </Footer>
);

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({
  children,
}: RootLayoutProps): Promise<ReactNode> {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body>
        <Layout
          banner={banner}
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/caching-tools/next-shared-cache/tree/canary/docs/cache-handler-docs"
          footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
