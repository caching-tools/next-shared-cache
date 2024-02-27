import type { RedisClientType, createClient } from 'redis';

export type RedisJSON = Parameters<RedisClientType['json']['set']>['2'];

/**
 * The configuration options for the Redis Handler
 */
export type CreateRedisStackHandlerOptions<T = ReturnType<typeof createClient>> = {
    /**
     * The Redis client instance.
     */
    client: T;
    /**
     * Optional. Prefix for all keys, useful for namespacing. Defaults to an empty string.
     */
    keyPrefix?: string;
    /**
     * Timeout in milliseconds for Redis operations. Defaults to 5000.
     */
    timeoutMs?: number;
};

export type CreateRedisStringsHandlerOptions = CreateRedisStackHandlerOptions & {
    /**
     * Optional. Key for storing cache tags. Defaults to `__sharedTags__`.
     */
    sharedTagsKey?: string;
};
