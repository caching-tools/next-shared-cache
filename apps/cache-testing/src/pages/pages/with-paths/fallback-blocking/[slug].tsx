import type { GetStaticPathsResult, GetStaticPropsContext, GetStaticPropsResult } from 'next';

type PageProps = { count: number };

export async function getStaticProps({ params }: GetStaticPropsContext): Promise<GetStaticPropsResult<PageProps>> {
    if (!params) {
        throw new Error('no params');
    }

    const { slug } = params;

    if (!slug || Array.isArray(slug)) {
        throw new Error('no slug');
    }

    const result = await fetch(`http://localhost:8081/${slug}`);

    if (!result.ok) {
        return { notFound: true, revalidate: 60 };
    }

    const parsedResult = (await result.json()) as { count: number } | null;

    if (!parsedResult) {
        return { notFound: true, revalidate: 60 };
    }

    return { props: { count: parsedResult.count }, revalidate: 60 };
}

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

export default function Index({ count }: PageProps): JSX.Element {
    return <div id="pages/with-paths/fallback-blocking">{count}</div>;
}
