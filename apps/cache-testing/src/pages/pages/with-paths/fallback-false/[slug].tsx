import type { GetStaticPathsResult } from 'next';
import CommonPagesPage from '../fallback-blocking/[slug]';
import { createPagesGetStaticProps } from '../../../../utils/create-pages-get-static-props';

export const getStaticProps = createPagesGetStaticProps('pages/with-paths/fallback-false');

export function getStaticPaths(): Promise<GetStaticPathsResult> {
    return Promise.resolve({
        paths: [
            '/pages/with-paths/fallback-false/200',
            '/pages/with-paths/fallback-false/404',
            '/pages/with-paths/fallback-false/alternate-200-404',
        ],
        fallback: false,
    });
}

export default CommonPagesPage;
