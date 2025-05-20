import { createRedisCacheHandler } from '@neshca/cache-handler/use-cache/node-redis';
import { createClient } from 'redis';

export default createRedisCacheHandler({
  client: createClient({
    RESP: 2,
    url: process.env.REDIS_URL,
  }),
  keyPrefix: 'use-cache-redis:',
  sharedTagsKey: 'tags',
});
