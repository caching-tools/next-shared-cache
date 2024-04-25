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
     */
    timeoutMs?: number;
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
     * By default, the expiration strategy is set to `'EXPIREAT'` for compatibility previous `@neshca/cache-handler` versions.
     *
     * @default 'EXPIREAT'
     *
     * @since 1.3.0
     *
     * @remarks
     * - The `'EXPIREAT'` strategy requires Redis server 4.0.0 or newer.
     * - The `'EXAT'` strategy requires Redis server 6.2.0 or newer.
     */
    keyExpirationStrategy?: 'EXAT' | 'EXPIREAT';
};

export type CreateRedisSitemapHandlerOptions = CreateRedisStackHandlerOptions & {
    /**
     * Optional. The absolute path to the Next.js server directory.
     * If provided, the Handler will populate the sitemap with the pre-rendered pages.
     *
     * @since 1.4.0
     */
    serverDistDir?: string;
    /**
     * Optional. The key for storing sitemap links.
     *
     * @default '__sitemap__'
     *
     * @since 1.4.0
     */
    sitemapKey?: string;
};
