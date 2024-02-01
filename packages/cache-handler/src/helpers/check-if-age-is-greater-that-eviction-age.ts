import { UseTtlOptions } from '../common-types';
import { calculateEvictionDelay } from './calculate-eviction-delay';

/**
 * Checks if the age of a cache item is greater than its eviction age.
 *
 * @param lastModified - The timestamp (in milliseconds since the Unix Epoch) when the item was last modified.
 * @param maxAgeSeconds - The maximum age (in seconds) before an item is considered stale.
 * @param useTtl - {@link UseTtlOptions.useTtl}.
 *
 * @returns - Returns true if the age of the item is greater than or equal to its eviction age, otherwise false.
 *
 * @example
 * ```js
 * const lastModified = Date.now() - 60000; // 1 minute ago
 * const maxAgeSeconds = 30; // 30 seconds
 * const useTtl = { useTtl: true };
 *
 * ageIsGreaterThatEvictionAge(lastModified, maxAgeSeconds, useTtl);
 * // Returns: true
 * ```
 */
export function checkIfAgeIsGreaterThatEvictionAge(
    lastModified: number | undefined,
    maxAgeSeconds: number | undefined,
    useTtl: UseTtlOptions['useTtl'],
) {
    const ageSeconds = lastModified ? Math.floor((Date.now() - lastModified) / 1000) : -1;

    const evictionAge = calculateEvictionDelay(maxAgeSeconds, useTtl);

    return typeof evictionAge === 'number' && evictionAge <= ageSeconds;
}
