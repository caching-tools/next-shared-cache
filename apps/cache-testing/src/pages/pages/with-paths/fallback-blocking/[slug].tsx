import type { GetStaticPathsResult } from 'next';
import CommonPagesPage from '../../no-paths/fallback-blocking/[slug]';
import { createPagesGetStaticProps } from '../../../../utils/create-pages-get-static-props';

export const getStaticProps = createPagesGetStaticProps('pages/with-paths/fallback-blocking');

export function getStaticPaths(): Promise<GetStaticPathsResult> {
    return Promise.resolve({
        paths: [
            '/pages/with-paths/fallback-blocking/200',
            '/pages/with-paths/fallback-blocking/404',
            '/pages/with-paths/fallback-blocking/alternate-200-404',
        ],
        fallback: 'blocking',
    });
}

export default CommonPagesPage;
