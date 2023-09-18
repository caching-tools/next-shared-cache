import type { GetStaticPathsResult, GetStaticPropsContext, GetStaticPropsResult } from 'next';

type PageProps = { name: string };

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
        paths: ['/pages-dir/static/200', '/pages-dir/static/404', '/pages-dir/static/alternate-200-404'],
        fallback: false,
    });
}

export default function Index({ name }: PageProps): JSX.Element {
    return <div id="app-dir-page-static">{name}</div>;
}
