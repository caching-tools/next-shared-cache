import { replaceJsonWithBase64, reviveFromBase64Representation } from '@neshca/json-replacer-reviver';

import type { Cache, CacheHandlerValue, RevalidatedTags } from '../cache-handler';

export type ServerCacheHandlerOptions = {
    /**
     * The base URL of the cache store server.
     */
    baseUrl: URL | string;
    /**
     * Timeout in milliseconds for remote cache store operations.
     */
    timeoutMs?: number;
};

/**
 * Creates a server-based Handler to use with the `@neshca/server` package.
 *
 * This function initializes a Handler for managing cache operations via a server.
 * It includes methods to get, set, and manage cache values and revalidated tags,
 * leveraging server-side storage.
 *
 * @param options - The configuration options for the server Handler. See {@link ServerCacheHandlerOptions}.
 *
 * @returns An object representing the cache, with methods for cache operations.
 *
 * @example
 * ```js
 * const serverCache = createCache({
 *   baseUrl: 'http://localhost:8080/',
 * });
 * ```
 *
 * @remarks
 * - the `get` method retrieves a value from the server cache. If the server response is not OK, it returns `null`.
 * - the `set` method allows setting a value in the server cache.
 * - the `getRevalidatedTags` method retrieves revalidated tags from the server.
 * - the `revalidateTag` method updates the revalidation time for a specific tag in the server cache.
 */
export default function createCache({ baseUrl, timeoutMs }: ServerCacheHandlerOptions): Cache {
    return {
        name: 'server',
        async get(key) {
            const url = new URL('/get', baseUrl);

            url.searchParams.set('key', key);

            const response = await fetch(url, {
                signal: timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined,
                // @ts-expect-error -- act as an internal fetch call
                next: {
                    internal: true,
                },
            });

            if (response.status === 404) {
                return null;
            }

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const string = await response.text();

            return JSON.parse(string, reviveFromBase64Representation) as CacheHandlerValue;
        },
        async set(key, value, ttl) {
            const url = new URL('/set', baseUrl);

            const response = await fetch(url, {
                method: 'POST',
                body: JSON.stringify([key, JSON.stringify(value, replaceJsonWithBase64), ttl]),
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined,
                // @ts-expect-error -- act as an internal fetch call
                next: {
                    internal: true,
                },
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
        },

        async getRevalidatedTags() {
            const url = new URL('/getRevalidatedTags', baseUrl);

            const response = await fetch(url, {
                signal: timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined,
                // @ts-expect-error -- act as an internal fetch call
                next: {
                    internal: true,
                },
            });

            if (!response.ok) {
                throw new Error('Server error.', { cause: response });
            }

            const json = (await response.json()) as RevalidatedTags;

            return json;
        },
        async revalidateTag(tag, revalidatedAt) {
            const url = new URL('/revalidateTag', baseUrl);

            const response = await fetch(url, {
                method: 'POST',
                body: JSON.stringify([tag, revalidatedAt]),
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined,
                // @ts-expect-error -- act as an internal fetch call
                next: {
                    internal: true,
                },
            });

            if (response.status > 500 && response.status < 600) {
                throw new Error(`Server error: ${response.status}`);
            }
        },
    };
}
