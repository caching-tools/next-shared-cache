import { createClient } from 'redis';

const client = createClient({ url: 'redis://localhost:6379' });

client.on('error', () => {});

console.info('Waiting for Redis to be ready...');
await client.connect();
console.info('Redis is ready!');

client.quit();
