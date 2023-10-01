#!/usr/bin/env node

import { pino } from 'pino';
import Fastify from 'fastify';
import type { TagsManifest } from '@neshca/next-types';

const logger = pino({
    transport: {
        target: 'pino-pretty',
    },
    logLevel: 'info',
});

const server = Fastify();

const cache = new Map<string, string>();

const revalidatedTags = new Map<string, number>();

const host = '::';
const port = 8080;

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
    const tagsManifest: TagsManifest = {
        items: {},
        version: 1,
    };

    for (const [tag, revalidatedAt] of revalidatedTags.entries()) {
        tagsManifest.items[tag] = {
            revalidatedAt,
        };
    }

    await reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send(tagsManifest);
});

server.post('/revalidateTag', async (request, reply): Promise<void> => {
    const [tag, revalidatedAt] = request.body as [string, number];

    revalidatedTags.set(tag, revalidatedAt);

    await reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send(null);
});

server
    .listen({ port, host })
    .then((address) => {
        logger.info(`server listening on %s`, address);
    })
    .catch((err) => {
        logger.error(err);
        process.exit(1);
    });
