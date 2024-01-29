import type { GetStaticProps, GetStaticPropsContext, GetStaticPropsResult } from 'next';

import type { CountBackendApiResponseJson, PageProps } from './types';

const revalidate = 5;

export function createPagesGetStaticProps(path: string): GetStaticProps<PageProps> {
    return async function getStaticProps({ params }: GetStaticPropsContext): Promise<GetStaticPropsResult<PageProps>> {
        if (!params) {
            throw new Error('no params');
        }

        const { slug } = params;

        if (!slug || Array.isArray(slug)) {
            throw new Error('no slug');
        }

        const pathAndTag = `/count/${path}/${slug}`;

        const url = new URL(pathAndTag, 'http://localhost:8081');

        const result = await fetch(url);

        if (!result.ok) {
            return { notFound: true, revalidate };
        }

        const parsedResult = (await result.json()) as CountBackendApiResponseJson;

        return {
            props: {
                count: parsedResult.count,
                time: parsedResult.unixTimeMs,
                revalidateAfter: revalidate * 1000,
                path,
            },
            revalidate,
        };
    };
}
