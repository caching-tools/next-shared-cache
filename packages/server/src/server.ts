#!/usr/bin/env node

import type { NextCacheImplicitTagId } from '@repo/next-common';
import createCacheStore from '@repo/next-lru-cache/next-cache-handler-value';
import Fastify from 'fastify';
import { pino } from 'pino';

const NEXT_CACHE_IMPLICIT_TAG_ID: NextCacheImplicitTagId = '_N_T_';

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

const revalidatedTags = new Map<string, number>();

server.get('/get', async (request, reply): Promise<void> => {
    const { key, implicitTags: implicitTagsString } = request.query as { key: string; implicitTags: string };

    const cacheValue = lruCacheStore.get(key);

    if (!cacheValue) {
        await reply.code(404).send(null);

        return;
    }

    if (cacheValue.lifespan && cacheValue.lifespan.expireAt < Date.now() / 1000) {
        lruCacheStore.delete(key);

        await reply.code(404).send(null);
    }

    const implicitTags = JSON.parse(implicitTagsString);

    const combinedTags = new Set([...cacheValue.tags, ...implicitTags]);

    if (combinedTags.size === 0) {
        await reply.code(404).send(null);
    }

    for (const tag of combinedTags) {
        const revalidationTime = revalidatedTags.get(tag);

        if (revalidationTime && revalidationTime > cacheValue.lastModified) {
            lruCacheStore.delete(key);

            await reply.code(404).send(null);
        }
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

    if (tag.startsWith(NEXT_CACHE_IMPLICIT_TAG_ID)) {
        revalidatedTags.set(tag, Date.now());
    }

    await reply.code(200).send();
});

server.get('/clear-cache', async (_request, reply): Promise<void> => {
    lruCacheStore.clear();

    await reply.code(200).send(true);
});

server.delete('/:key', async (request, reply): Promise<void> => {
    const { key } = request.params as { key?: string };

    if (!key) {
        await reply.code(200).send(false);

        return;
    }

    lruCacheStore.delete(key);

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
