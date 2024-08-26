import calculate from 'cluster-key-slot';
import type { createCluster } from 'redis';
import type { CacheHandlerValue, Handler } from '../cache-handler';
import type { CreateRedisStringsHandlerOptions } from '../common-types';

import { REVALIDATED_TAGS_KEY } from '../constants';
import { getTimeoutRedisCommandOptions } from '../helpers/get-timeout-redis-command-options';
import { isImplicitTag } from '../helpers/is-implicit-tag';

type CreateRedisClusterHandlerOptions<T = ReturnType<typeof createCluster>> = CreateRedisStringsHandlerOptions & {
    /**
     * Use `cluster` instead of `client`.
     */
    client: never;
    /**
     * The Redis cluster instance.
     *
     * @since 1.5.0
     */
    cluster: T;
};

function groupKeysBySlot(keys: string[]): Map<number, string[]> {
    const slotKeysMap: Map<number, string[]> = new Map();

    for (const key of keys) {
        const slot = calculate(key);

        const slotKeys = slotKeysMap.get(slot);

        if (slotKeys) {
            slotKeys.push(key);
        } else {
            slotKeysMap.set(slot, [key]);
        }
    }

    return slotKeysMap;
}

/**
 * Creates a Handler for handling cache operations using Redis Cluster.
 *
 * ⚠️ This Handler is currently experimental and subject to change
 * or removal in future updates without a major version increment.
 * Use with caution.
 *
 * This function initializes a Handler for managing cache operations using Redis.
 * It supports Redis Cluster. The resulting Handler includes
 * methods to get, set, and manage cache values fot on-demand revalidation.
 *
 * @param options - The configuration options for the Redis Handler. See {@link CreateRedisClusterHandlerOptions}.
 *
 * @returns An object representing the cache, with methods for cache operations.
 *
 * @example
 * ```js
 * const cluster = createCluster(clusterOptions);
 *
 * const clusterHandler = await createHandler({
 *   cluster,
 *   keyPrefix: 'myApp:',
 * });
 * ```
 *
 * @remarks
 * - the `get` method retrieves a value from the cache, automatically converting `Buffer` types when necessary.
 * - the `set` method allows setting a value in the cache.
 * - the `revalidateTag` methods are used for handling tag-based cache revalidation.
 */
export default function createHandler({
    cluster,
    keyPrefix = '',
    sharedTagsKey = '__sharedTags__',
    timeoutMs = 5000,
    keyExpirationStrategy = 'EXPIREAT',
    revalidateTagQuerySize = 100,
}: CreateRedisClusterHandlerOptions): Handler {
    const revalidatedTagsKey = keyPrefix + REVALIDATED_TAGS_KEY;

    return {
        name: 'experimental-redis-cluster',
        async get(key, { implicitTags }) {
            const result = await cluster.get(getTimeoutRedisCommandOptions(timeoutMs), keyPrefix + key);

            if (!result) {
                return null;
            }

            const cacheValue = JSON.parse(result) as CacheHandlerValue | null;

            if (!cacheValue) {
                return null;
            }

            const combinedTags = new Set([...cacheValue.tags, ...implicitTags]);

            if (combinedTags.size === 0) {
                return cacheValue;
            }

            const revalidationTimes = await cluster.hmGet(
                getTimeoutRedisCommandOptions(timeoutMs),
                revalidatedTagsKey,
                Array.from(combinedTags),
            );

            for (const timeString of revalidationTimes) {
                if (timeString && Number.parseInt(timeString, 10) > cacheValue.lastModified) {
                    await cluster.unlink(getTimeoutRedisCommandOptions(timeoutMs), keyPrefix + key);

                    return null;
                }
            }

            return cacheValue;
        },
        async set(key, cacheHandlerValue) {
            const options = getTimeoutRedisCommandOptions(timeoutMs);

            let setOperation: Promise<string | null>;

            let expireOperation: Promise<boolean> | undefined;

            switch (keyExpirationStrategy) {
                case 'EXAT': {
                    setOperation = cluster.set(
                        options,
                        keyPrefix + key,
                        JSON.stringify(cacheHandlerValue),
                        typeof cacheHandlerValue.lifespan?.expireAt === 'number'
                            ? {
                                  EXAT: cacheHandlerValue.lifespan.expireAt,
                              }
                            : undefined,
                    );
                    break;
                }
                case 'EXPIREAT': {
                    setOperation = cluster.set(options, keyPrefix + key, JSON.stringify(cacheHandlerValue));

                    expireOperation = cacheHandlerValue.lifespan
                        ? cluster.expireAt(options, keyPrefix + key, cacheHandlerValue.lifespan.expireAt)
                        : undefined;
                    break;
                }
            }

            const setTagsOperation = cacheHandlerValue.tags.length
                ? cluster.hSet(options, keyPrefix + sharedTagsKey, key, JSON.stringify(cacheHandlerValue.tags))
                : undefined;

            await Promise.all([setOperation, expireOperation, setTagsOperation]);
        },
        async revalidateTag(tag) {
            // If the tag is an implicit tag, we need to mark it as revalidated.
            // The revalidation process is done by the CacheHandler class on the next get operation.
            if (isImplicitTag(tag)) {
                await cluster.hSet(getTimeoutRedisCommandOptions(timeoutMs), revalidatedTagsKey, tag, Date.now());
            }

            const tagsMap: Map<string, string[]> = new Map();

            let cursor = 0;

            const hScanOptions = { COUNT: revalidateTagQuerySize };

            do {
                const remoteTagsPortion = await cluster.hScan(
                    getTimeoutRedisCommandOptions(timeoutMs),
                    keyPrefix + sharedTagsKey,
                    cursor,
                    hScanOptions,
                );

                for (const { field, value } of remoteTagsPortion.tuples) {
                    tagsMap.set(field, JSON.parse(value));
                }

                cursor = remoteTagsPortion.cursor;
            } while (cursor !== 0);

            const keysToDelete: string[] = [];

            const tagsToDelete: string[] = [];

            for (const [key, tags] of tagsMap) {
                if (tags.includes(tag)) {
                    keysToDelete.push(keyPrefix + key);
                    tagsToDelete.push(key);
                }
            }

            if (keysToDelete.length === 0) {
                return;
            }

            const slotKeysMap = groupKeysBySlot(keysToDelete);

            const unlinkPromises: Promise<number>[] = [];

            for (const [slot, keys] of slotKeysMap) {
                const targetMasterNode = cluster.slots[slot]?.master;
                const client = await targetMasterNode?.client;

                if (keys.length === 0 || !client) {
                    continue;
                }

                const unlinkPromisesForSlot = client.unlink(getTimeoutRedisCommandOptions(timeoutMs), keys);

                if (unlinkPromisesForSlot) {
                    unlinkPromises.push(unlinkPromisesForSlot);
                }
            }

            const updateTagsOperation = cluster.hDel(
                { isolated: true, ...getTimeoutRedisCommandOptions(timeoutMs) },
                keyPrefix + sharedTagsKey,
                tagsToDelete,
            );

            await Promise.allSettled([...unlinkPromises, updateTagsOperation]);
        },
        async delete(key) {
            await cluster.unlink(getTimeoutRedisCommandOptions(timeoutMs), key);
        },
    };
}
