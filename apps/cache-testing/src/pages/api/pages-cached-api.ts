import { formatTime } from 'cache-testing/utils/format-time';
import type { CountBackendApiResponseJson } from 'cache-testing/utils/types';
import type { NextApiRequest, NextApiResponse } from 'next';

import { neshClassicCache } from '@neshca/cache-handler/functions';

export const config = {
    runtime: 'nodejs',
};

const fetchWithCache = neshClassicCache(async (url: URL | string) => {
    const result = await fetch(url);

    if (!result.ok) {
        throw new Error('Failed to fetch');
    }

    const json = (await result.json()) as CountBackendApiResponseJson;

    return json;
});

export default async function handler(request: NextApiRequest, response: NextApiResponse): Promise<void> {
    if (request.method !== 'GET') {
        return response.status(405).send(null);
    }

    const path = request.url;

    const pathAndTag = '/count/pages/api/api/200';

    const revalidate = 5;

    const url = new URL(pathAndTag, 'http://localhost:8081');

    const result = await fetchWithCache({ revalidate, tags: [String(path)], responseContext: response }, url);

    if (!result) {
        return response.status(404).send(null);
    }

    const parsedResult = result;

    response.json({
        props: {
            count: parsedResult.count,
            time: formatTime(parsedResult.unixTimeMs),
            revalidateAfter: formatTime(parsedResult.unixTimeMs + revalidate * 1000),
            timeMs: parsedResult.unixTimeMs,
            revalidateAfterMs: parsedResult.unixTimeMs + revalidate * 1000,
            path,
        },
    });
}
