#!/usr/bin/env node

import { createServer } from 'node:http';
import Fastify from 'fastify';

const host = '::';
const port = 8081;

const initialTime = Date.now();

const pathMeta: Record<string, { count: number; lastRequestTime: number }> = {
    '/200': { count: 0, lastRequestTime: initialTime },
    '/404': { count: 0, lastRequestTime: initialTime },
    '/alternate-200-404': { count: 0, lastRequestTime: initialTime },
};

const server = Fastify({
    serverFactory(handler) {
        return createServer((request, response) => {
            const meta = pathMeta[String(request.url)];

            const requestTime = Date.now();
            console.log(request.url, 'delay', requestTime - meta.lastRequestTime);
            handler(request, response);
            meta.count += 1;
            meta.lastRequestTime = requestTime;
        });
    },
});

server.get('/200', async (_request, reply): Promise<void> => {
    const { count } = pathMeta['/200'];

    await reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send({ count });
});

server.get('/404', async (_request, reply): Promise<void> => {
    const { count } = pathMeta['/404'];

    await reply.code(404).header('Content-Type', 'application/json; charset=utf-8').send({ count });
});

server.get('/alternate-200-404', async (_request, reply): Promise<void> => {
    const { count } = pathMeta['/alternate-200-404'];

    await reply
        .code(count % 2 === 0 ? 200 : 404)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send({ count });
});

server
    .listen({ port, host })
    .then((address) => {
        console.log(`server listening on ${address}`);
    })
    .catch((err) => {
        console.log('Error starting server:', err);
        process.exit(1);
    });
