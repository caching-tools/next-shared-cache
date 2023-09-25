#!/usr/bin/env node

import { pino } from 'pino';
import Fastify from 'fastify';
import type {
    CacheHandlerParametersGetWithTags,
    CacheHandlerParametersRevalidateTag,
    CacheHandlerParametersSet,
} from '@neshca/next-types';
import { IncrementalCache } from './incremental-cache';

const logger = pino({
    transport: {
        target: 'pino-pretty',
    },
    logLevel: 'info',
});

const server = Fastify();

const cache = new IncrementalCache();

const host = '::';
const port = 8080;

server.post('/get', async (request, reply): Promise<void> => {
    const data = cache.get(...(request.body as CacheHandlerParametersGetWithTags));

    await reply
        .code(data ? 200 : 404)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send(data);
});

server.post('/set', async (request, reply): Promise<void> => {
    cache.set(...(request.body as CacheHandlerParametersSet));

    await reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send();
});

server.post('/revalidateTag', async (request, reply): Promise<void> => {
    cache.revalidateTag(...(request.body as CacheHandlerParametersRevalidateTag));

    await reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send();
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
