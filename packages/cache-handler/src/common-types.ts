import type { RedisClientType } from 'redis';

export type RedisJSON = Parameters<RedisClientType['json']['set']>['2'];

export type CacheHandlerOptions = {
    /**
     * Optional. If set to true, logs errors to the console. Defaults to false.
     */
    unstable__logErrors?: boolean;
};
