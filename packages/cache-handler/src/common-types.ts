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
     * Optional. Prefix for all keys, useful for namespacing.
     *
     * @default '' // empty string
     *
     * @since 1.0.0
     */
    keyPrefix?: string;
    /**
     * Optional. Timeout in milliseconds for Redis operations.
     *
     * @default 5000 // 5000 ms
     *
     * @since 1.0.0
     *
     * @remarks
     * To disable timeout of Redis operations, set this option to 0.
     */
    timeoutMs?: number;
    /**
     * Optional. The number of tags in a single query retrieved from Redis when scanning or searching for tags.
     *
     * @default 100 // 100 tags
     *
     * @since 1.4.0
     *
     * @remarks
     * You can adjust this value to optimize the number of commands sent to Redis when scanning or searching for tags.
     * A higher value will reduce the number of commands sent to Redis,
     * but it will also increase the amount of data transferred over the network.
     * Redis uses TCP and typically has 65,535 bytes as the maximum size of a packet (it can be lower depending on MTU).
     */
    revalidateTagQuerySize?: number;
};

export type CreateRedisStringsHandlerOptions = CreateRedisStackHandlerOptions & {
    /**
     * Optional. Key for storing cache tags.
     *
     * @default '__sharedTags__'
     *
     * @since 1.0.0
     */
    sharedTagsKey?: string;
    /**
     * Optional. It allows you to choose the expiration strategy for cache keys.
     *
     * - `'EXAT'`: Uses the `EXAT` option of the `SET` command to set the expiration time. This is more efficient than `EXPIREAT`.
     * - `'EXPIREAT'`: Uses the `EXPIREAT` command to set the expiration time. This requires an additional command call.
     *
     * @default 'EXAT'
     *
     * @since 1.3.0
     *
     * @remarks
     * - The `'EXAT'` strategy requires Redis server 6.2.0 or newer.
     * - The `'EXPIREAT'` strategy requires Redis server 4.0.0 or newer.
     */
    keyExpirationStrategy?: 'EXAT' | 'EXPIREAT';
};
