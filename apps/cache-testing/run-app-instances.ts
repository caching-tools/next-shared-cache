#!/usr/bin/env node

import { scheduler } from 'node:timers/promises';
import Fastify from 'fastify';
import * as pm2Default from 'pm2';

const { default: pm2 } = pm2Default as unknown as { default: typeof import('pm2') };

const args = process.argv.slice(2).reduce<Record<string, string>>((acc, arg) => {
    const [key, value] = arg.split('=');

    if (!(key && value)) {
        throw new Error(`Invalid argument: ${arg}`);
    }

    acc[key] = value;
    return acc;
}, {});

const { hostname = 'localhost', ports = '3000' } = args;

function getNameByPort(port: string): string {
    return `@neshca/cache-testing-${port}`;
}

pm2.connect(true, (connectError?: Error) => {
    if (connectError) {
        console.error(connectError);
        process.exit(1);
    }

    for (const port of ports.split(',')) {
        const name = getNameByPort(port);

        pm2.start(
            {
                script: `.next/__instances/${port}/apps/cache-testing/server.js`,
                name,
                env: {
                    ...process.env,
                    PORT: port,
                    HOSTNAME: hostname,
                    SERVER_STARTED: '1',
                },
            },
            (startError?: Error) => {
                if (startError) {
                    console.error(startError);
                }
            },
        );
    }
});

const app = Fastify();

app.get('/', async (_request, reply) => {
    await reply.send('ok');
});

app.get('/restart/:port', async (request, reply) => {
    const { port } = request.params as { port: string };

    const name = getNameByPort(port);

    pm2.restart(name, (restartError: unknown) => {
        if (restartError) {
            console.error(restartError);

            void reply.code(500).send({ status: 'error' });
        }

        // workaround for unstable tests
        void scheduler.wait(1000).then(async () => {
            await reply.code(200).send({ restarted: name });
        });
    });

    return reply;
});

app.listen({ port: 9000, host: 'localhost' }, (error, address) => {
    if (error) {
        console.error(error);
        process.exit(1);
    }
    console.info(`orchestration listening on ${address}`);
});
