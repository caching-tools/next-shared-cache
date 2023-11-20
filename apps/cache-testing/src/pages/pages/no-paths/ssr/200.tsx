import { CommonPagesPage } from 'cache-testing/utils/common-pages-page';
import { createPagesGetServerSideProps } from 'cache-testing/utils/create-pages-get-get-server-side-props';

export const getServerSideProps = createPagesGetServerSideProps('pages/no-paths/ssr/200');

export default CommonPagesPage;
