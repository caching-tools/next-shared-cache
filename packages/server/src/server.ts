#!/usr/bin/env node

import { createCache } from '@neshca/next-lru-cache/cache-string-value';
import Fastify from 'fastify';
import { pino } from 'pino';

const logger = pino({
    transport: {
        target: 'pino-pretty',
    },
    level: process.env.CI ? 'silent' : 'info',
});

const server = Fastify();

const cache = createCache();

const revalidatedItems = new Map<string, number>();

const host = process.env.HOST ?? 'localhost';
const port = Number.parseInt(process.env.PORT ?? '8080', 10);

server.get('/get', async (request, reply): Promise<void> => {
    const { key } = request.query as { key: string };

    const data = cache.get(key);

    await reply.code(data ? 200 : 404).send(data);
});

server.post('/set', async (request, reply): Promise<void> => {
    const [key, data] = request.body as [string, string, number];

    cache.set(key, data);

    await reply.code(200).send();
});

server.get('/getRevalidatedTags', async (_request, reply): Promise<void> => {
    await reply.code(200).send(Object.fromEntries(revalidatedItems));
});

server.post('/revalidateTag', async (request, reply): Promise<void> => {
    const [tag, revalidatedAt] = request.body as [string, number];

    revalidatedItems.set(tag, revalidatedAt);

    await reply.code(200).send();
});

server.get('/clear-cache', async (_request, reply): Promise<void> => {
    cache.clear();

    await reply.code(200).send(true);
});

server
    .listen({ port, host })
    .then((address) => {
        logger.info(`next-cache-server listening on %s`, address);
    })
    .catch((err) => {
        logger.error(err);
        process.exit(1);
    });
