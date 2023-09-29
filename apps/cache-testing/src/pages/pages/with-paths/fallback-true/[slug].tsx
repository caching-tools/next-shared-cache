import type { GetStaticPathsResult } from 'next';
import CommonPagesPage from '../fallback-blocking/[slug]';
import { createPagesGetStaticProps } from '../../../../utils/create-pages-get-static-props';

export const getStaticProps = createPagesGetStaticProps('pages/with-paths/fallback-true');

export function getStaticPaths(): Promise<GetStaticPathsResult> {
    return Promise.resolve({
        paths: [
            '/pages/with-paths/fallback-true/200',
            '/pages/with-paths/fallback-true/404',
            '/pages/with-paths/fallback-true/alternate-200-404',
        ],
        fallback: true,
    });
}

export default CommonPagesPage;
