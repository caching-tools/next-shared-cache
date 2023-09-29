import type { GetStaticPathsResult } from 'next';
import { createPagesGetStaticProps } from '../../../../utils/create-pages-get-static-props';
import { CommonPagesPage } from '../../../../utils/common-pages-page';

export const getStaticProps = createPagesGetStaticProps('pages/no-paths/fallback-blocking');

export function getStaticPaths(): Promise<GetStaticPathsResult> {
    return Promise.resolve({
        paths: [],
        fallback: 'blocking',
    });
}

export default CommonPagesPage;
