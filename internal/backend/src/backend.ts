#!/usr/bin/env node

import { randomBytes } from 'node:crypto';
import Fastify from 'fastify';
import { pino } from 'pino';

const logger = pino({
    transport: {
        target: 'pino-pretty',
    },
    level: process.env.CI ? 'silent' : 'info',
});

const host = process.env.HOST ?? 'localhost';
const port = Number.parseInt(process.env.PORT ?? '8081', 10);

function createCounter(): [count: number, lastRequestTime: number] {
    return [0, Date.now()];
}

const pathMeta = new Map<string, [count: number, lastRequestTime: number]>();

const server = Fastify();

server.addHook('preHandler', (request, _reply, done) => {
    let meta = pathMeta.get(request.url);

    if (!meta) {
        meta = createCounter();
        pathMeta.set(request.url, meta);
    }

    const [, lastRequestTime] = meta;

    const requestTime = Date.now();

    logger.info('%s delay %d', request.url, requestTime - lastRequestTime);

    meta[0] += 1;
    meta[1] = requestTime;

    done();
});

server.get('/count/:routerType/:preRendered:/:fallback/:page', async (request, reply): Promise<void> => {
    const { page } = request.params as { page: string };

    const meta = pathMeta.get(request.url);

    if (!meta) {
        throw new Error('meta not found');
    }

    const [count] = meta;

    const result = { count, unixTimeMs: Date.now() };

    switch (page) {
        case '404':
            await reply.code(404).header('Content-Type', 'application/json; charset=utf-8').send(result);
            break;
        case '200':
            await reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send(result);
            break;
        case 'alternate-200-404':
            await reply
                .code(count % 2 === 0 ? 200 : 404)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(result);
            break;
    }
});

server.get('/randomHex/:routerType/:length', async (request, reply): Promise<void> => {
    const { length = '100000' } = request.params as { length?: string };

    const randomHex = randomBytes(Number.parseInt(length, 10)).toString('hex');

    const result = { randomHex, unixTimeMs: Date.now() };

    await reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send(result);
});

server.get('/time', async (_request, reply): Promise<void> => {
    const result = { unixTimeMs: Date.now() };

    await reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send(result);
});

server
    .listen({ port, host })
    .then((address) => {
        logger.info(`backend listening on %s`, address);
    })
    .catch((err) => {
        logger.error(err);
        process.exit(1);
    });
