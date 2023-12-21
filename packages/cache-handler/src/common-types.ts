import type { RedisClientType } from 'redis';

export type RedisJSON = Parameters<RedisClientType['json']['set']>['2'];
