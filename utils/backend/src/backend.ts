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

const initialTime = Date.now();

const pathMeta: Record<string, [count: number, lastRequestTime: number]> = {
    '/200': [0, initialTime],
    '/404': [0, initialTime],
    '/alternate-200-404': [0, initialTime],
};

const server = Fastify();

server.addHook('preHandler', (request, _reply, done) => {
    const { url } = request;
    const meta = pathMeta[url];
    const [, lastRequestTime] = meta;

    const requestTime = Date.now();

    logger.info('%s delay %d', request.url, requestTime - lastRequestTime);

    meta[0] += 1;
    meta[1] = requestTime;

    done();
});

server.get('/200', async (_request, reply): Promise<void> => {
    const [count] = pathMeta['/200'];

    await reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send({ count });
});

server.get('/404', async (_request, reply): Promise<void> => {
    const [count] = pathMeta['/404'];

    await reply.code(404).header('Content-Type', 'application/json; charset=utf-8').send({ count });
});

server.get('/alternate-200-404', async (_request, reply): Promise<void> => {
    const [count] = pathMeta['/alternate-200-404'];

    await reply
        .code(count % 2 === 0 ? 200 : 404)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send({ count });
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
