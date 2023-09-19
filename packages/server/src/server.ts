#!/usr/bin/env node

import Fastify from 'fastify';
import type {
    CacheHandlerParametersGet,
    CacheHandlerParametersRevalidateTag,
    CacheHandlerParametersSet,
} from 'next-types';
import { IncrementalCache } from './incremental-cache';

const server = Fastify();

const cache = new IncrementalCache();

const host = '::';
const port = 8080;

server.post('/get', async (request, reply): Promise<void> => {
    const [cacheKey] = request.body as CacheHandlerParametersGet;

    const data = cache.get(cacheKey);

    if (!data) {
        await reply.code(404).header('Content-Type', 'application/json; charset=utf-8').send();

        return;
    }

    await reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send(data);
});

server.post('/set', async (request, reply): Promise<void> => {
    const [cacheKey, data, ctx] = request.body as CacheHandlerParametersSet;

    cache.set(cacheKey, data, ctx);

    await reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send();
});

server.post('/revalidateTag', async (request, reply): Promise<void> => {
    const [tag] = request.body as CacheHandlerParametersRevalidateTag;

    cache.revalidateTag(tag);

    await reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send();
});

server.listen({ port, host }, (err) => {
    if (err) {
        server.log.error(err);
        process.exit(1);
    }
});
