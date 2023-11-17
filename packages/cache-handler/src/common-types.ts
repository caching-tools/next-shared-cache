import type { RedisClientType, RedisClusterType } from 'redis';
import type { CacheConfig } from './cache-handler';

export type RedisJSON = Parameters<RedisClientType['json']['set']>['2'];

export type CacheHandlerOptions<T extends RedisClientType | RedisClusterType> = {
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
    /**
     * Whether to read/write to disk. Defaults to 'read-yes/write-yes'.
     */
    diskAccessMode?: CacheConfig['diskAccessMode'];
    /**
     * Whether to log errors to the console. Defaults to false.
     */
    unstable__logErrors?: boolean;
};
