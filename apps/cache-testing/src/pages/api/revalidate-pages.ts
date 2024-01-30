import type { NextApiRequest, NextApiResponse } from 'next';

import { formatTime } from 'cache-testing/utils/format-time';

export default async function handler(request: NextApiRequest, result: NextApiResponse): Promise<void> {
    const { path } = request.query;

    if (!path) {
        result.status(400).send('Missing path to revalidate');
        return;
    }

    if (Array.isArray(path)) {
        result.status(400).send('Only a single path can be revalidated');
        return;
    }

    try {
        await result.revalidate(path);
        result.json({
            revalidated: true,
            now: formatTime(Date.now(), 3),
        });
    } catch (_error) {
        result.status(500).send('Error revalidating');
    }
}
