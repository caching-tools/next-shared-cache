import { getTimeoutRedisCommandOptions, promiseWithTimeout } from '@neshca/cache-handler/helpers';
import type { MetadataRoute } from 'next';
import { createClient } from 'redis';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const client = createClient({
        url: process.env.REDIS_URL,
    });

    await promiseWithTimeout(client.connect(), 1000);

    const sitemap: MetadataRoute.Sitemap = [];

    let currentCursor = 0;

    do {
        if (client.isReady === false) {
            throw new Error('Redis client is not ready yet or connection is lost. Keep trying...');
        }

        const options = getTimeoutRedisCommandOptions(1000);

        const { cursor, tuples } = await client.hScan(options, '__sitemap__', currentCursor, { COUNT: 100 });

        currentCursor = cursor;

        for (const { field, value } of tuples) {
            const url = new URL(field, 'https://example.com');

            sitemap.push({
                url: url.href,
                lastModified: new Date(Number.parseInt(value)),
                priority: 0.5,
                changeFrequency: 'always',
            });
        }
    } while (currentCursor !== 0);

    await client.quit();

    return sitemap;
}
