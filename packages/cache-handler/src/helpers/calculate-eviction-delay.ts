/**
 * Calculates the delay after which the cache entry must be deleted.
 *
 * @param maxAge - The original `maxAge` delay from the Next.js after which the cache entry will be treated as stale.
 * @param useTtl - The function or boolean value used to compute the delay after which the cache entry must be deleted.
 * @returns The calculated delay after which the cache entry must be deleted.
 *
 * @throws If the computed delay is invalid (not a number, NaN, less than `maxAge`, not an integer or not finite).
 *
 * @remarks
 * - If `useTtl` is `false` or `undefined`, the cache entry will never be deleted.
 * - If `useTtl` is `true`, the cache entry will be deleted after `maxAge` delay.
 * - If `useTtl` is a function, the cache entry will be deleted after the delay returned by the function.
 */
export function calculateEvictionDelay(
    maxAge: number | undefined,
    useTtl: boolean | ((maxAge: number) => number) | undefined | null,
): number | undefined {
    if (!maxAge || useTtl === false) {
        return undefined;
    }

    if (useTtl === true || !useTtl) {
        return maxAge;
    }

    const computedEvictionDelay = Math.ceil(useTtl(maxAge));

    if (
        typeof computedEvictionDelay !== 'number' ||
        isNaN(computedEvictionDelay) ||
        computedEvictionDelay <= 0 ||
        !isFinite(computedEvictionDelay)
    ) {
        throw new Error(
            `Invalid eviction delay "${computedEvictionDelay}" returned from useTtl function. Expected a positive integer. Received: ${computedEvictionDelay}`,
        );
    }

    return computedEvictionDelay;
}
