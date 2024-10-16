import type { GetServerSideProps, GetServerSidePropsResult } from 'next';

import { neshClassicCache } from '@neshca/cache-handler/functions';
import type { CountBackendApiResponseJson, PageProps } from './types';

const fetchWithCache = neshClassicCache(async (url: URL | string) => {
    const result = await fetch(url);

    if (!result.ok) {
        throw new Error('Failed to fetch');
    }

    const json = (await result.json()) as CountBackendApiResponseJson;

    return json;
});

export function createPagesGetServerSideProps(path: string): GetServerSideProps<PageProps> {
    return async function getServerSideProps({ res }): Promise<GetServerSidePropsResult<PageProps>> {
        const pathAndTag = `/count/${path}`;

        const revalidate = 5;

        const url = new URL(pathAndTag, 'http://localhost:8081');

        const result = await fetchWithCache(
            {
                revalidate,
                tags: [`/${path}`],
                responseContext: res,
            },
            url,
        );

        if (!result) {
            return { notFound: true };
        }

        const parsedResult = result;

        return {
            props: {
                count: parsedResult.count,
                time: parsedResult.unixTimeMs,
                revalidateAfter: revalidate * 1000,
                path,
            },
        };
    };
}
