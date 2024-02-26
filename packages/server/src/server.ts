#!/usr/bin/env node

import createCacheStore from '@neshca/next-lru-cache/next-cache-handler-value';
import Fastify from 'fastify';
import { pino } from 'pino';

const logger = pino({
    transport: {
        target: 'pino-pretty',
    },
    level: process.env.CI ? 'silent' : 'info',
});

const server = Fastify();

const lruCacheStore = createCacheStore();

const host = process.env.HOST ?? 'localhost';
const port = Number.parseInt(process.env.PORT ?? '8080', 10);

server.get('/get', async (request, reply): Promise<void> => {
    const { key } = request.query as { key: string };

    const cacheValue = lruCacheStore.get(key);

    if (!cacheValue) {
        await reply.code(404).send(null);

        return;
    }

    if (cacheValue.lifespan && cacheValue.lifespan.expireAt < Date.now() / 1000) {
        lruCacheStore.delete(key);

        await reply.code(404).send(null);
    }

    await reply.code(200).send(cacheValue);
});

server.post('/set', async (request, reply): Promise<void> => {
    const [key, data] = request.body as [string, string, number];

    lruCacheStore.set(key, JSON.parse(data));

    await reply.code(200).send();
});

server.post('/revalidateTag', async (request, reply): Promise<void> => {
    const [tag] = request.body as [string];

    for (const [key, { tags }] of lruCacheStore.entries()) {
        // If the value's tags include the specified tag, delete this entry
        if (tags.includes(tag)) {
            lruCacheStore.delete(key);
        }
    }

    await reply.code(200).send();
});

server.get('/clear-cache', async (_request, reply): Promise<void> => {
    lruCacheStore.clear();

    await reply.code(200).send(true);
});

server
    .listen({ port, host })
    .then((address) => {
        logger.info('next-cache-server listening on %s', address);
    })
    .catch((err) => {
        logger.error(err);
        process.exit(1);
    });
