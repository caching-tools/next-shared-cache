import { createRedisCacheHandler } from '@neshca/cache-handler/use-cache/node-redis';
import { createClient } from 'redis';

export default createRedisCacheHandler({
  client: createClient({
    url: process.env.REDIS_URL,
  }),
  keyPrefix: 'use-cache-redis:',
  sharedTagsKey: 'tags',
});
