import type { GetStaticPathsResult } from 'next';
import { createPagesGetStaticProps } from 'cache-testing/utils/create-pages-get-static-props';
import { CommonPagesPage } from 'cache-testing/utils/common-pages-page';

export const getStaticProps = createPagesGetStaticProps('pages/with-paths/fallback-blocking');

export function getStaticPaths(): Promise<GetStaticPathsResult> {
    return Promise.resolve({
        paths: [{ params: { slug: '200' } }, { params: { slug: '404' } }, { params: { slug: 'alternate-200-404' } }],
        fallback: 'blocking',
    });
}

export default CommonPagesPage;
