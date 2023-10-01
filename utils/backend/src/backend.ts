#!/usr/bin/env node

import Fastify from 'fastify';
import { pino } from 'pino';

const logger = pino({
    transport: {
        target: 'pino-pretty',
    },
    level: 'info',
});

const host = '::';
const port = 8081;

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

server.get('/:nextApi/:rerendered:/:fallback/:page', async (request, reply): Promise<void> => {
    const meta = pathMeta.get(request.url);

    if (!meta) {
        throw new Error('');
    }
    const [count] = meta;

    const { page } = request.params as { page: string };

    if (page === '404') {
        await reply.code(404).header('Content-Type', 'application/json; charset=utf-8').send({ count });
    } else if (page === '200') {
        await reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send({ count });
    } else if (page === 'alternate-200-404') {
        await reply
            .code(count % 2 === 0 ? 200 : 404)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send({ count });
    }
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
