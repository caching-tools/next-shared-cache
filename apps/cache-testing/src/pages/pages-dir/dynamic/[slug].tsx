import type { GetStaticPathsResult, GetStaticPropsContext, GetStaticPropsResult } from 'next';
import { normalizeSlug } from '../../../utils/normalize-slug';
import RootLayout from '../../layout';

type PageProps = { name: string };

export async function getStaticProps({ params }: GetStaticPropsContext): Promise<GetStaticPropsResult<PageProps>> {
    if (!params) {
        throw new Error('no params');
    }

    const { slug } = params;

    if (!slug || Array.isArray(slug)) {
        throw new Error('no slug');
    }

    const result = await fetch(`http://localhost:8081/${normalizeSlug(slug)}`);

    if (!result.ok) {
        return { notFound: true, revalidate: 5 };
    }

    const parsedResult = (await result.json()) as { name: string } | null;

    if (!parsedResult) {
        return { notFound: true, revalidate: 5 };
    }

    return { props: { name: parsedResult.name }, revalidate: 5 };
}

export function getStaticPaths(): Promise<GetStaticPathsResult> {
    return Promise.resolve({
        paths: [],
        fallback: 'blocking',
    });
}

function Index({ name }: PageProps): JSX.Element {
    return <div id="pages-dir-page-dynamic">{name}</div>;
}

Index.getLayout = RootLayout;

export default Index;
