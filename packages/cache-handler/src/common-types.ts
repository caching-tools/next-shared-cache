import type { RedisClientType } from 'redis';

export type RedisJSON = Parameters<RedisClientType['json']['set']>['2'];

export type UseTtlOptions = {
    /**
     * Optional. Boolean or function that returns a delay after which the cache entry must be deleted.
     *
     * Function receives the `maxAge` from the Next.js as a parameter.
     * This can be used to emulate the behavior of the stale-while-revalidate strategy.
     *
     * @example
     *
     * ```js
     * const lruCache = createLruCache({
     *   // emulate the behavior of the stale-while-revalidate strategy
     *   useTtl: (maxAge) => maxAge * 1.5
     * });
     * ```
     *
     * @remarks
     * - **File System Cache**: Ensure that the file system cache is disabled
     * by setting `useFileSystem: false` in your cache handler configuration.
     * This is crucial for the TTL feature to work correctly.
     * If the file system cache is enabled,
     * the cache entries will HIT from the file system cache when expired in remote cache store.
     * - **Pages Directory Limitation**: Due to a known issue in Next.js,
     * disabling the file system cache may not function properly within the Pages directory.
     * It is recommended to use TTL primarily with the App directory.
     * More details on this limitation can be found in the file system cache configuration documentation.
     */
    useTtl?: boolean | ((ttl: number) => number);
};
