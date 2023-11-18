#!/usr/bin/env node

import { pino } from 'pino';
import Fastify from 'fastify';
import { createCache } from '@neshca/next-lru-cache/cache-string-value';
import type { TagsManifest } from '@neshca/next-common';

const logger = pino({
    transport: {
        target: 'pino-pretty',
    },
    level: process.env.CI ? 'silent' : 'info',
});

const server = Fastify();

const cache = createCache();

const tagsManifest: TagsManifest = {
    items: {},
    version: 1,
};

const host = process.env.HOST ?? 'localhost';
const port = Number.parseInt(process.env.PORT ?? '8080', 10);

server.get('/get', async (request, reply): Promise<void> => {
    const { key } = request.query as { key: string };

    const data = cache.get(key);

    await reply
        .code(data ? 200 : 404)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send(data);
});

server.post('/set', async (request, reply): Promise<void> => {
    const [key, data] = request.body as [string, string, number];

    cache.set(key, data);

    await reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send(null);
});

server.get('/getTagsManifest', async (_request, reply): Promise<void> => {
    await reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send(tagsManifest);
});

server.post('/revalidateTag', async (request, reply): Promise<void> => {
    const [tag, revalidatedAt] = request.body as [string, number];

    tagsManifest.items[tag] = { revalidatedAt };

    await reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send(null);
});

server.get('/clear-cache', async (_request, reply): Promise<void> => {
    cache.clear();

    await reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send({ cache: 'cleared' });
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
