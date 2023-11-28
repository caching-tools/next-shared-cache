import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(_request: NextApiRequest, result: NextApiResponse): Promise<void> {
    const port = Number.parseInt(process.env.PORT ?? '3000', 10);
    const isRunning = process.env.SERVER_STARTED === '1';

    if (!isRunning) {
        result.status(200).json({ status: 'ok' });

        return;
    }

    const restartResult = await fetch(`http://localhost:9000/restart/${port}`, {
        next: {
            // @ts-expect-error -- act as an internal fetch call
            internal: true,
        },
    });

    const json = (await restartResult.json()) as unknown;

    result.json(json);
}
