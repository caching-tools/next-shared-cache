import type { GetStaticPathsResult } from 'next';

import { CommonPagesPage } from 'cache-testing/utils/common-pages-page';
import { createPagesGetStaticProps } from 'cache-testing/utils/create-pages-get-static-props';

export const getStaticProps = createPagesGetStaticProps('pages/no-paths/fallback-false');

export function getStaticPaths(): Promise<GetStaticPathsResult> {
    return Promise.resolve({
        paths: [],
        fallback: false,
    });
}

export default CommonPagesPage;
