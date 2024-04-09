import type { RedisClientType, createClient } from 'redis';

export type RedisJSON = Parameters<RedisClientType['json']['set']>['2'];

/**
 * The configuration options for the Redis Handler
 *
 * @since 1.0.0
 */
export type CreateRedisStackHandlerOptions<T = ReturnType<typeof createClient>> = {
    /**
     * The Redis client instance.
     *
     * @since 1.0.0
     */
    client: T;
    /**
     * Optional. Prefix for all keys, useful for namespacing. Defaults to an empty string.
     *
     * @since 1.0.0
     */
    keyPrefix?: string;
    /**
     * Timeout in milliseconds for Redis operations. Defaults to 5000.
     *
     * @since 1.0.0
     */
    timeoutMs?: number;
};

export type CreateRedisStringsHandlerOptions = CreateRedisStackHandlerOptions & {
    /**
     * Optional. Key for storing cache tags. Defaults to `__sharedTags__`.
     *
     * @since 1.0.0
     */
    sharedTagsKey?: string;
};
