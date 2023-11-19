import type { RedisClientType, RedisClusterType } from 'redis';
import type { CacheConfig } from './cache-handler';

export type RedisJSON = Parameters<RedisClientType['json']['set']>['2'];

type CacheHandlerOptions = {
    /**
     * Whether to read/write to disk. Defaults to 'read-yes/write-yes'.
     */
    diskAccessMode?: CacheConfig['diskAccessMode'];
    /**
     * Whether to log errors to the console. Defaults to false.
     */
    unstable__logErrors?: boolean;
};

export type RedisCacheHandlerOptions<T extends RedisClientType | RedisClusterType> = CacheHandlerOptions & {
    /**
     * Redis client instance
     */
    client: T;
    /**
     * Prefix for all keys. Useful for namespacing. Defaults to no prefix.
     */
    keyPrefix?: string;
    /**
     * Key to store the tags manifest. Defaults to '__sharedTagsManifest__'.
     */
    tagsManifestKey?: string;
};

export type ServerCacheHandlerOptions = CacheHandlerOptions & {
    /**
     * Base URL of the server.
     */
    baseUrl: string;
};
