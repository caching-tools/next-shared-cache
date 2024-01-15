import type { GetStaticPathsResult } from 'next';

import { CommonPagesPage } from 'cache-testing/utils/common-pages-page';
import { createPagesGetStaticProps } from 'cache-testing/utils/create-pages-get-static-props';

export const getStaticProps = createPagesGetStaticProps('pages/with-paths/fallback-false');

export function getStaticPaths(): Promise<GetStaticPathsResult> {
    return Promise.resolve({
        paths: [{ params: { slug: '200' } }, { params: { slug: '404' } }, { params: { slug: 'alternate-200-404' } }],
        fallback: false,
    });
}

export default CommonPagesPage;
