/* eslint-disable import/no-default-export -- use default here */
/* eslint-disable camelcase -- unstable__* */
/* eslint-disable no-console -- log errors */
import { reviveFromBase64Representation, replaceJsonWithBase64 } from '@neshca/json-replacer-reviver';
import type { CacheHandlerValue, Cache, RevalidatedTags } from '../cache-handler';
import type { CacheHandlerOptions } from '../common-types';

export type ServerCacheHandlerOptions = CacheHandlerOptions & {
    /**
     * The base URL of the cache store server.
     */
    baseUrl: URL | string;
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
 *   unstable__logErrors: true
 * });
 * ```
 *
 * @remarks
 * The `get` method retrieves a value from the server cache. If the server response is not OK, it returns `null`.
 *
 * The `set` method allows setting a value in the server cache.
 *
 * The `getRevalidatedTags` method retrieves revalidated tags from the server.
 *
 * The `revalidateTag` method updates the revalidation time for a specific tag in the server cache.
 *
 * Error handling: If `unstable__logErrors` is true, errors during cache operations are logged to the console.
 */
export default function createCache({ baseUrl, unstable__logErrors }: ServerCacheHandlerOptions): Cache {
    return {
        async get(key) {
            try {
                const url = new URL('/get', baseUrl);

                url.searchParams.set('key', key);

                const response = await fetch(url, {
                    // @ts-expect-error -- act as an internal fetch call
                    next: {
                        internal: true,
                    },
                });

                if (!response.ok) {
                    return null;
                }

                if (response.status > 500 && response.status < 600) {
                    throw new Error(`Server error: ${response.status}`);
                }

                const string = await response.text();

                return JSON.parse(string, reviveFromBase64Representation) as CacheHandlerValue;
            } catch (error) {
                if (unstable__logErrors) {
                    console.error('cache.get', error);
                }

                return null;
            }
        },
        async set(key, value, ttl) {
            try {
                const url = new URL('/set', baseUrl);
                const response = await fetch(url, {
                    method: 'POST',
                    body: JSON.stringify([key, JSON.stringify(value, replaceJsonWithBase64), ttl]),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    // @ts-expect-error -- act as an internal fetch call
                    next: {
                        internal: true,
                    },
                });

                if (response.status > 500 && response.status < 600) {
                    throw new Error(`Server error: ${response.status}`);
                }
            } catch (error) {
                if (unstable__logErrors) {
                    console.error('cache.set', error);
                }
            }
        },

        async getRevalidatedTags() {
            try {
                const url = new URL('/getRevalidatedTags', baseUrl);

                const response = await fetch(url, {
                    // @ts-expect-error -- act as an internal fetch call
                    next: {
                        internal: true,
                    },
                });

                if (!response.ok) {
                    throw new Error(`Server error.`, { cause: response });
                }

                const json = (await response.json()) as RevalidatedTags;

                return json;
            } catch (error) {
                if (unstable__logErrors) {
                    console.error('cache.getRevalidatedTags', error);
                }
            }
        },
        async revalidateTag(tag, revalidatedAt) {
            try {
                const url = new URL('/revalidateTag', baseUrl);

                const response = await fetch(url, {
                    method: 'POST',
                    body: JSON.stringify([tag, revalidatedAt]),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    // @ts-expect-error -- act as an internal fetch call
                    next: {
                        internal: true,
                    },
                });

                if (response.status > 500 && response.status < 600) {
                    throw new Error(`Server error: ${response.status}`);
                }
            } catch (error) {
                if (unstable__logErrors) {
                    console.error('cache.revalidateTag', error);
                }
            }
        },
    };
}
