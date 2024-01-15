import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

import type { CountBackendApiResponseJson, PageProps } from './types';

export function createPagesGetServerSideProps(
    path: string,
): ({ params }: GetServerSidePropsContext) => Promise<GetServerSidePropsResult<PageProps>> {
    return async function getServerSideProps(): Promise<GetServerSidePropsResult<PageProps>> {
        const pathAndTag = `/count/${path}`;

        const url = new URL(pathAndTag, 'http://localhost:8081');

        const result = await fetch(url);

        if (!result.ok) {
            return { notFound: true };
        }

        const parsedResult = (await result.json()) as CountBackendApiResponseJson;

        return {
            props: {
                count: parsedResult.count,
                time: parsedResult.unixTimeMs,
                revalidateAfter: Infinity,
                path,
            },
        };
    };
}
