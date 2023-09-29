import type { GetStaticPathsResult } from 'next';
import { createPagesGetStaticProps } from '../../../../utils/create-pages-get-static-props';
import CommonPagesPage from '../fallback-blocking/[slug]';

export const getStaticProps = createPagesGetStaticProps('pages/no-paths/fallback-true');

export function getStaticPaths(): Promise<GetStaticPathsResult> {
    return Promise.resolve({
        paths: [],
        fallback: true,
    });
}

export default CommonPagesPage;
