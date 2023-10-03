import type { NextApiRequest, NextApiResponse } from 'next';

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
            now: new Date().toLocaleTimeString('ru-RU', {
                fractionalSecondDigits: 3,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }),
        });
    } catch (err) {
        result.status(500).send('Error revalidating');
    }
}
