import { CommonPagesPage } from 'cache-testing/utils/common-pages-page';
import { createPagesGetServerSideProps } from 'cache-testing/utils/create-pages-get-get-server-side-props-cached';

export const config = {
    runtime: 'nodejs',
};

export const getServerSideProps = createPagesGetServerSideProps('pages/no-paths/ssr-with-cache/200');

export default CommonPagesPage;
